from flask import Flask, Response, redirect, render_template, request, jsonify, session, url_for
import json
from pathlib import Path

from CF import NeuMF, predicted_rating_items
from CBF import preprocess_text, load_model, convert_tfidf_to_array, cosine_similarity_items

import pandas as pd
from sklearn.model_selection import train_test_split
import joblib
import os
import pickle
from pathlib import Path
import torch
import numpy as np

app = Flask(__name__, static_folder="static", template_folder="templates")

def load_pickle(filename):
    if not filename.endswith('.pkl'):
        filename += '.pkl'
    
    try:
        with open(filename, 'rb', buffering=65536) as f:
            variable = pickle.load(f)
        return variable
        
    except Exception as e:
        print(f"❌ Error loading: {e}")
        return None

# ======== TF-IDF Model ========
import numpy as np
import math

class TFIDFModel:
	def __init__(self):
		self.tf_dict = {}
		self.df_dict = {}
		self.idf_dict = {}
		self.vocabulary = set()
		self.id_item = []
		self.titles = []
		self.tfidf_dict = []

	def fit(self, documents, titles, id_item):
		if isinstance(documents, pd.Series):
			documents = documents.tolist()
		words = [doc.split() for doc in documents]
		self.vocabulary = sorted(set([word for doc in words for word in doc]))
		self.tf_dict, self.df_dict = self.calc_TF_and_DF(words)
		N = len(documents)
		self.idf_dict = self.calc_IDF(N, self.df_dict)
		self.id_item = id_item
		self.titles = titles
		self.tfidf_dict = [self.calc_TFIDF(tf_dict) for tf_dict in self.tf_dict]

	def calc_TF_and_DF(self, words_list):
		tf_dict = []
		df_dict = {word: 0 for word in self.vocabulary}
		for words in words_list:
			total_words = len(words)
			doc_tf = {word: 0 for word in self.vocabulary}
			df_found = []
			for term in words:
				if term in doc_tf:
					doc_tf[term] += 1
				else:
					doc_tf[term] = 1
				if term not in df_found:
					df_dict[term] += 1
					df_found.append(term)
			for term in doc_tf:
				doc_tf[term] = doc_tf[term] / total_words
			tf_dict.append(doc_tf)
		return tf_dict, df_dict

	def calc_IDF(self, N, df_dict):
		idf_dict = {}
		for word, df in df_dict.items():
			idf_dict[word] = math.log((N + 1) / (df + 1))
		return idf_dict

	def calc_TFIDF(self, TF_dict):
		tfidf_dict = {}
		for term in TF_dict:
			tfidf_dict[term] = TF_dict[term] * self.idf_dict.get(term, 0)
		return tfidf_dict

	def transform(self, documents):
		if isinstance(documents, str):
			documents = [documents]
		if isinstance(documents, pd.Series):
			documents = documents.tolist()
		words_list = [doc.split() for doc in documents]
		tfidf_list = []
		for words in words_list:
			total_words = len(words)
			doc_tf = {word: 0 for word in self.vocabulary}
			for term in words:
				if term in doc_tf:
					doc_tf[term] += 1
				else:
					doc_tf[term] = 1
			for term in doc_tf:
				doc_tf[term] = doc_tf[term] / total_words
			tfidf = self.calc_TFIDF(doc_tf)
			tfidf_list.append(tfidf)
		return tfidf_list

user2user_encoded = load_pickle("models/user2user_encoded")
user_encoded2user = load_pickle("models/user_encoded2user")

item2item_encoded = load_pickle("models/item2item_encoded")
item_encoded2item = load_pickle("models/item_encoded2item")

# =================== CF ===================
num_users = len(user2user_encoded)
num_items = len(item2item_encoded)
embedding_size = 16
hidden_layer_size = [32, 16, 8]
NEUMF_MODEL_PATH = "models/neumf_model.pth"
if os.path.exists(NEUMF_MODEL_PATH):
    neumf_model_new = NeuMF(num_users, num_items, embedding_size, hidden_layer_size)
    neumf_model_new.load_state_dict(torch.load(NEUMF_MODEL_PATH, map_location='cpu'))
    neumf_model_new.eval()

# =================== CBF ===================
TFIDF_MODEL_PATH = "models/tfidf_model.pkl"
if os.path.exists(TFIDF_MODEL_PATH):
    loaded_model = load_model(TFIDF_MODEL_PATH)
    model_tfidf = loaded_model.tfidf_dict
    vocabulary = loaded_model.vocabulary
    titles = loaded_model.titles.values
    id_item = loaded_model.id_item.values
    model_tfidf_array = np.array([convert_tfidf_to_array(tf, vocabulary) for tf in model_tfidf])

# ================== ROUTES ==================
@app.route("/")
def index():
    return redirect(url_for("homepage"))

@app.route("/homepage")
def homepage():
    return render_template("homepage.html", page="homepage")

@app.route("/products")
def products():
    return render_template("products.html", page="products")

@app.route("/about")
def about():
    return render_template("about.html", page="about")

@app.route("/quiz")
def quiz():
    return render_template("quiz.html", page="quiz")

@app.route("/result")
def result():
    return render_template("result.html", page="result")

@app.route("/user-list")
def user_list():
    return render_template("user-list.html", page="user-list")

@app.get("/partials/navbar")
def partial_navbar():
    return render_template("partials/navbar.html")

@app.get("/partials/footer")
def partial_footer():
    return render_template("partials/footer.html")

@app.get("/partials/login-modal")
def partial_login():
    return render_template("partials/login-modal.html")

@app.get('/favicon.ico')
def favicon():
    return Response(status=204)  # no content, browser berhenti minta

@app.post("/quiz_process")
def quiz_process():
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)
    id_user = payload.get("id_user", None)
    print(f"id_user: {id_user}")
    preferences = payload.get("preferences", None)
    if not preferences:
        return jsonify({"ok": False, "error": "missing preferences"})

    try:
        item_recommendations = run_hybrid_recommendation(id_user, preferences)
        return jsonify({"ok": True, "count": len(item_recommendations), "items": item_recommendations})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"ok": False, "error": "processing_failed"})

def run_hybrid_recommendation(id_user, preferences, alpha=0.9):
    # =================== CBF ===================
    cbf_result = cosine_similarity_items(preferences, loaded_model, model_tfidf_array, vocabulary, id_item)
    cbf_similarity = np.array([item['similarity'] for item in cbf_result])
    if id_user != None and id_user != "guest" and id_user in list(user2user_encoded.keys()):
        # =================== CF ===================
        cf_result = predicted_rating_items(id_user, neumf_model_new, user2user_encoded, item_encoded2item)
        cf_predicted_rating = np.array([item['predicted_rating'] for item in cf_result])
        weighted_scores = (1-alpha) * cf_predicted_rating + alpha * cbf_similarity
    else:
        weighted_scores = cbf_similarity.copy()

    weighted_result = []
    for idx, score in enumerate(weighted_scores):
        weighted_result.append({
            'id_item': int(cbf_result[idx]['id_item']),
            'weighted_score': float(round(score, 4))
        })
    
    recommendations = sorted(weighted_result, key=lambda x: x['weighted_score'], reverse=True)
    return recommendations


if __name__ == "__main__":
    app.run(debug=False)
