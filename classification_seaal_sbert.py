
import warnings
warnings.filterwarnings("ignore")

import os
import re
import sys
import joblib

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import LabelEncoder

from sklearn.metrics import (
    accuracy_score, f1_score, precision_score,
    recall_score, confusion_matrix, ConfusionMatrixDisplay
)
from sklearn.svm import SVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer
from sklearn.feature_selection import SelectKBest, chi2, f_classif
from nltk.tokenize import word_tokenize
import torch
from transformers import AutoTokenizer, AutoModel
from gensim.models import Word2Vec, FastText
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
# ── Création des dossiers de sortie 
os.makedirs("figures", exist_ok=True)
os.makedirs("modele",  exist_ok=True)

# ── Chargement des données 
CSV_PATH = "reclamations_seaal.csv"
df = pd.read_csv(CSV_PATH, sep=";", usecols=["texte", "categorie"]).dropna()
print(f"[INFO] {len(df)} lignes chargées — {df['categorie'].nunique()} catégories")

# ── Distribution des réclamations
counts = df["categorie"].value_counts().sort_index()

fig, ax = plt.subplots(figsize=(8, 6))
sns.barplot(x=counts.index, y=counts.values,
            palette="viridis", edgecolor="black", alpha=0.8, ax=ax)
ax.set_title("Nombre de réclamations par catégorie",
             fontweight="bold", fontsize=14)
ax.set_xlabel("")
ax.set_ylabel("Nombre", fontsize=12)
ax.tick_params(axis="x", rotation=25)
ax.grid(axis="y", linestyle="--", alpha=0.7)
for i, v in enumerate(counts.values):
    ax.text(i, v + counts.max() * 0.02, str(v),
            ha="center", va="bottom", fontweight="bold", fontsize=11)
fig.tight_layout()
fig.savefig("figures/distribution_reclamations.png")
plt.close(fig)

# ── Prétraitement 
def preprocess(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-zàâäéèêëîïôöùûüçœæ0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    words = word_tokenize(text, language='french')
    return " ".join(words)
df["clean"] = df["texte"].apply(preprocess)

# ── LabelEncoder unique (réutilisé partout) 
le = LabelEncoder()
df["label"] = le.fit_transform(df["categorie"])
class_names: np.ndarray = le.classes_
joblib.dump(le, "modele/label_encoder.pkl")
print(f"[OK] label_encoder.pkl sauvegardé — classes : {list(class_names)}")

# ── Split train / test (stratifié) 
X_train, X_test, y_train, y_test = train_test_split(
    df["clean"].values,
    df["label"].values,
    test_size=0.2,
    random_state=42,
    stratify=df["label"].values
)

# ── Fonction d'évaluation 
def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    return {
        "acc":  round(accuracy_score(y_true, y_pred) * 100, 1),
        "prec": round(precision_score(y_true, y_pred,
                                      average="macro", zero_division=0) * 100, 1),
        "rec":  round(recall_score(y_true, y_pred,
                                   average="macro", zero_division=0) * 100, 1),
        "f1":   round(f1_score(y_true, y_pred,
                               average="macro", zero_division=0) * 100, 1),
    }

def afficher_metriques(y_true: np.ndarray, y_pred: np.ndarray):
    prec = precision_score(y_true, y_pred, average="macro", zero_division=0)
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    rec = recall_score(y_true, y_pred, average="macro", zero_division=0)
    print(f"Précision moyenne : {prec:.4f}".replace(".", ","))
    print(f"Exactitude moyenne : {acc:.4f}".replace(".", ","))
    print(f"Score F1 moyen : {f1:.4f}".replace(".", ","))
    print(f"Rappel moyen : {rec:.4f}".replace(".", ","))
    print()

# ── Modèle 1 : TF-IDF + SVM (kernel linéaire) 
print("\n=== TF-IDF + SVM ===")
tfidf = TfidfVectorizer(max_features=5000)
X_tr_tfidf = tfidf.fit_transform(X_train)
X_te_tfidf = tfidf.transform(X_test)
clf_tfidf  = SVC(kernel="linear", probability=True).fit(X_tr_tfidf, y_train)
pred_tfidf = clf_tfidf.predict(X_te_tfidf)
res_tfidf  = evaluate(y_test, pred_tfidf)
afficher_metriques(y_test, pred_tfidf)

# ── Modèle 2 : SBERT CamemBERT Base + SVM (kernel RBF) 
print("\n=== SBERT (CamemBERT Base) + SVM ===")
sbert_base   = SentenceTransformer("dangvantuan/sentence-camembert-base")
X_tr_sbert   = sbert_base.encode(X_train.tolist(), show_progress_bar=True, batch_size=32)
X_te_sbert   = sbert_base.encode(X_test.tolist(),  show_progress_bar=True, batch_size=32)
clf_base     = SVC(kernel="rbf", probability=True).fit(X_tr_sbert, y_train)
pred_sbert   = clf_base.predict(X_te_sbert)
res_sbert    = evaluate(y_test, pred_sbert)
afficher_metriques(y_test, pred_sbert)

# ── Matrice de confusion générale - SBERT CamemBERT 
fig_cm, ax_cm = plt.subplots(figsize=(8, 6))
cm_sbert = confusion_matrix(y_test, pred_sbert)
disp = ConfusionMatrixDisplay(confusion_matrix=cm_sbert, display_labels=class_names)
disp.plot(cmap="Blues", ax=ax_cm, values_format="d")
ax_cm.set_title("Matrice de confusion - SVC + SBERT CamemBERT", fontsize=12, pad=15)
plt.setp(ax_cm.get_xticklabels(), rotation=30, ha="right")
plt.setp(ax_cm.get_yticklabels(), rotation=0)
fig_cm.tight_layout()
fig_cm.savefig("figures/matrice_confusion_general_sbert.png", dpi=300, bbox_inches='tight')
plt.close(fig_cm)

# ── Modèle 3 : mBERT (classique) + SVM 
print("\n=== mBERT + SVM ===")
tokenizer_mbert = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
model_mbert = AutoModel.from_pretrained("bert-base-multilingual-cased")
model_mbert.eval()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_mbert.to(device)

def get_mbert_embeddings(texts, batch_size=32):
    all_emb = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        inputs = tokenizer_mbert(batch, padding=True, truncation=True, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model_mbert(**inputs)
        # Moyenne des tokens pour obtenir l'embedding de phrase
        all_emb.append(outputs.last_hidden_state.mean(dim=1).cpu().numpy())
    return np.vstack(all_emb)

print("[...] Encodage avec mBERT (cela peut prendre un peu de temps)...")
X_tr_mbert = get_mbert_embeddings(X_train.tolist())
X_te_mbert = get_mbert_embeddings(X_test.tolist())
clf_mbert = SVC(kernel="rbf", probability=True).fit(X_tr_mbert, y_train)
pred_mbert = clf_mbert.predict(X_te_mbert)
res_mbert = evaluate(y_test, pred_mbert)
afficher_metriques(y_test, pred_mbert)

# ── Modèles Gensim : Préparation des tokens
X_train_tokens = [str(text).split() for text in X_train]
X_test_tokens = [str(text).split() for text in X_test]

def get_mean_vector(model, tokens, vector_size):
    vecs = [model.wv[word] for word in tokens if word in model.wv]
    if len(vecs) > 0:
        return np.mean(vecs, axis=0)
    else:
        return np.zeros(vector_size)

# ── Modèle Gensim 1 : Word2Vec + SVM
print("\n=== Word2Vec + SVM ===")
w2v_model = Word2Vec(sentences=X_train_tokens, vector_size=100, window=5, min_count=1, workers=4)
X_tr_w2v = np.array([get_mean_vector(w2v_model, tokens, 100) for tokens in X_train_tokens])
X_te_w2v = np.array([get_mean_vector(w2v_model, tokens, 100) for tokens in X_test_tokens])

clf_w2v = SVC(kernel="rbf", probability=True).fit(X_tr_w2v, y_train)
pred_w2v = clf_w2v.predict(X_te_w2v)
res_w2v = evaluate(y_test, pred_w2v)
afficher_metriques(y_test, pred_w2v)

# ── Modèle Gensim 2 : FastText + SVM
print("\n=== FastText + SVM ===")
ft_model = FastText(sentences=X_train_tokens, vector_size=100, window=5, min_count=1, workers=4)
X_tr_ft = np.array([get_mean_vector(ft_model, tokens, 100) for tokens in X_train_tokens])
X_te_ft = np.array([get_mean_vector(ft_model, tokens, 100) for tokens in X_test_tokens])

clf_ft = SVC(kernel="rbf", probability=True).fit(X_tr_ft, y_train)
pred_ft = clf_ft.predict(X_te_ft)
res_ft = evaluate(y_test, pred_ft)
afficher_metriques(y_test, pred_ft)

# ── Modèle Gensim 3 : Doc2Vec + SVM
print("\n=== Doc2Vec + SVM ===")
tagged_train = [TaggedDocument(words=tokens, tags=[str(i)]) for i, tokens in enumerate(X_train_tokens)]
d2v_model = Doc2Vec(tagged_train, vector_size=100, window=5, min_count=1, workers=4, epochs=20)

X_tr_d2v = np.array([d2v_model.infer_vector(tokens) for tokens in X_train_tokens])
X_te_d2v = np.array([d2v_model.infer_vector(tokens) for tokens in X_test_tokens])

clf_d2v = SVC(kernel="rbf", probability=True).fit(X_tr_d2v, y_train)
pred_d2v = clf_d2v.predict(X_te_d2v)
res_d2v = evaluate(y_test, pred_d2v)
afficher_metriques(y_test, pred_d2v)


# ── Sauvegarde du modèle SVC final 
joblib.dump(clf_base, "modele/sbert_svc_model.pkl")
print("[OK] sbert_svc_model.pkl sauvegardé dans modele/")

# ── Résultats comparatifs 
print("\n=== RÉSULTATS FINAUX ===")
print("--- TF-IDF + SVM ---")
afficher_metriques(y_test, pred_tfidf)
print("--- mBERT + SVM ---")
afficher_metriques(y_test, pred_mbert)
print("--- SBERT (CamemBERT Base) ---")
afficher_metriques(y_test, pred_sbert)
print("--- Word2Vec + SVM ---")
afficher_metriques(y_test, pred_w2v)
print("--- FastText + SVM ---")
afficher_metriques(y_test, pred_ft)
print("--- Doc2Vec + SVM ---")
afficher_metriques(y_test, pred_d2v)


def plot_all_comparisons(names: list, results: list, filename: str, title: str) -> None:
    metrics = ["Accuracy", "Précision", "Rappel", "F1-score"]
    all_scores = [[res["acc"], res["prec"], res["rec"], res["f1"]] for res in results]
    
    x = np.arange(len(metrics))
    n_models = len(names)
    width = 0.15
    
    # Format optimisé pour un mémoire (plus grand, haute résolution)
    fig, ax = plt.subplots(figsize=(12, 8))
    colors = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#9333ea"]
    
    bars_list = []
    for i in range(n_models):
        pos = x - (n_models * width) / 2 + (i * width) + width / 2
        # Ajout de bordures pour un rendu plus net
        bars = ax.bar(pos, all_scores[i], width, label=names[i], color=colors[i % len(colors)], edgecolor='black', linewidth=0.5)
        bars_list.append(bars)
        
    ax.set_title(title, fontsize=16, fontweight="bold", pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=12)
    ax.set_ylabel("Score (%)", fontsize=12)
    ax.set_ylim(0, 120)
    
    # Ajout d'une grille horizontale pour faciliter la lecture
    ax.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Légende placée en bas, centrée, horizontale
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.1), ncol=n_models, fontsize=11)
    
    for bars in bars_list:
        for bar in bars:
            yval = bar.get_height()
            ax.text(bar.get_x() + bar.get_width() / 2, yval + 1.5,
                    f"{yval}%", ha="center", va="bottom",
                    fontweight="bold", fontsize=8)
            
    fig.subplots_adjust(bottom=0.2)
    fig.tight_layout()
    # Sauvegarde en haute qualité (300 dpi) sans rogner la légende
    fig.savefig(f"figures/{filename}", dpi=300, bbox_inches='tight')
    plt.close(fig)


plot_all_comparisons(
    names=["TF-IDF", "SBERT-CamemBERT"],
    results=[res_tfidf, res_sbert],
    filename="comparaison_tfidf_vs_sbert.png",
    title="Comparaison : TF-IDF vs SBERT-CamemBERT"
)

plot_all_comparisons(
    names=["TF-IDF", "Word2Vec", "FastText", "Doc2Vec", "BERT"],
    results=[res_tfidf, res_w2v, res_ft, res_d2v, res_mbert],
    filename="comparaison_5_approches.png",
    title="Comparaison Globale : Les 5 approches principales"
)

print("[OK] Graphiques de comparaison sauvegardés dans figures/.")

# ── Validation Croisée 5-Fold — CamemBERT Base ───────────────────────
X_all: np.ndarray = df["clean"].values
y_all: np.ndarray = df["label"].values

# Pré-calcul unique de tous les embeddings (évite 5 encodages redondants)
print("\n[...] Pré-calcul des embeddings (dataset complet)...")
X_all_emb: np.ndarray = sbert_base.encode(
    X_all.tolist(), show_progress_bar=True, batch_size=32
)

print("\n=== Validation Croisée 5-Fold — CamemBERT Base ===")
skf          = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
fold_metrics = []
raw_fold_metrics = []

for fold, (train_idx, test_idx) in enumerate(skf.split(X_all, y_all), start=1):
    print(f"  Fold {fold}/5 ...")

    emb_tr: np.ndarray = X_all_emb[train_idx]
    emb_te: np.ndarray = X_all_emb[test_idx]
    y_tr:   np.ndarray = y_all[train_idx]
    y_te:   np.ndarray = y_all[test_idx]

    clf_fold     = SVC(kernel="rbf", probability=True).fit(emb_tr, y_tr)
    y_pred_fold: np.ndarray = clf_fold.predict(emb_te)
    fold_metrics.append(evaluate(y_te, y_pred_fold))
    
    raw_fold_metrics.append({
        "prec": precision_score(y_te, y_pred_fold, average="macro", zero_division=0),
        "acc": accuracy_score(y_te, y_pred_fold),
        "f1": f1_score(y_te, y_pred_fold, average="macro", zero_division=0),
        "rec": recall_score(y_te, y_pred_fold, average="macro", zero_division=0)
    })

    # Matrice de confusion par fold
    cm_fold = confusion_matrix(y_te, y_pred_fold)
    fig3, ax3 = plt.subplots(figsize=(8, 6))
    sns.heatmap(cm_fold, annot=True, fmt="d", cmap="Greens",
                xticklabels=class_names, yticklabels=class_names,
                linewidths=0.5, linecolor="gray", ax=ax3)
    ax3.set_title(f"Matrice de confusion — Fold {fold}",
                  fontsize=13, fontweight="bold")
    ax3.set_ylabel("Étiquette réelle",   fontsize=11)
    ax3.set_xlabel("Étiquette prédite",  fontsize=11)
    plt.setp(ax3.get_xticklabels(), rotation=25, ha="right")
    plt.setp(ax3.get_yticklabels(), rotation=0)
    fig3.tight_layout()
    fig3.savefig(f"figures/matrice_confusion_fold{fold}.png")
    plt.close(fig3)

# ── Résumé des métriques par fold ────────────────────────────────────
print("\n=== Métriques par Fold ===")
for i, m in enumerate(raw_fold_metrics, 1):
    print(f"  Fold {i} :")
    print(f"    Précision moyenne : {m['prec']:.4f}".replace(".", ","))
    print(f"    Exactitude moyenne : {m['acc']:.4f}".replace(".", ","))
    print(f"    Score F1 moyen : {m['f1']:.4f}".replace(".", ","))
    print(f"    Rappel moyen : {m['rec']:.4f}".replace(".", ","))

avg_raw = {
    k: np.mean([m[k] for m in raw_fold_metrics])
    for k in raw_fold_metrics[0]
}
print("\n=== Moyenne 5-Fold ===")
print(f"Précision moyenne : {avg_raw['prec']:.4f}".replace(".", ","))
print(f"Exactitude moyenne : {avg_raw['acc']:.4f}".replace(".", ","))
print(f"Score F1 moyen : {avg_raw['f1']:.4f}".replace(".", ","))
print(f"Rappel moyen : {avg_raw['rec']:.4f}".replace(".", ","))

print("\n[OK] Figures sauvegardées dans 'figures/'.")
print("     Modèles : TF-IDF | CamemBERT Base")
print("     Fichiers : modele/sbert_svc_model.pkl | modele/label_encoder.pkl")