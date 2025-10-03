# ======== Preprocessing ========
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
import os
import pandas as pd

try:
	nltk.data.find('tokenizers/punkt')
except LookupError:
	nltk.download('punkt')

try:
	nltk.data.find('corpora/stopwords')
except LookupError:
	nltk.download('stopwords')

try:
	nltk.data.find('tokenizers/punkt_tab')
except LookupError:
	nltk.download('punkt_tab')

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
