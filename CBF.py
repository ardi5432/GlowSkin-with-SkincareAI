# ======== Preprocessing ========
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
import os
import pandas as pd

def merge_negations(tokens):
	negation_words = {'tidak', 'bukan', 'tanpa'}
	merged = []
	skip = False
	for i in range(len(tokens)):
		if skip:
			skip = False
			continue
		if tokens[i] in negation_words and i + 1 < len(tokens):
			merged.append(f"{tokens[i]} {tokens[i + 1]}")
			skip = True
		else:
			merged.append(tokens[i])
	return merged

def preprocess_text(text):
	text = text.lower()
	tokens = word_tokenize(text)
	tokens = merge_negations(tokens)
	stop_words = set(stopwords.words('indonesian'))
	tokens = [word for word in tokens if word not in stop_words]
	factory = StemmerFactory()
	stemmer = factory.create_stemmer()
	tokens = [stemmer.stem(word) for word in tokens]
	tokens = [re.sub(r'[^A-Za-z0-9]+', '', token) for token in tokens if re.sub(r'[^A-Za-z0-9]+', '', token) != '']
	return ' '.join(tokens)

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

def convert_tfidf_to_array(tfidf_dict, vocabulary):
	tfidf_array = [tfidf_dict.get(term, 0) for term in vocabulary]
	return np.array(tfidf_array)

# ========== Cosine Similarity ==========
from sklearn.metrics.pairwise import cosine_similarity

def cosine_similarity_items(find_product, loaded_model, model_tfidf_array, vocabulary, id_item):
	preprocess_find_product = preprocess_text(find_product)
	tfidf_find_product = loaded_model.transform(preprocess_find_product)
	tfidf_find_product_array = np.array([convert_tfidf_to_array(tf, vocabulary) for tf in tfidf_find_product])
	cosine_similarities = cosine_similarity(tfidf_find_product_array, model_tfidf_array)
	similarities = cosine_similarities[0]
	similar_items = []
	for idx_s, sim in enumerate(similarities):
		similar_items.append({
			"id_item": int(id_item[idx_s]),
			"similarity": float(round(sim, 4))
		})
	return similar_items
