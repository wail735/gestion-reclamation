import os
import re
import shutil
import joblib
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
import sys

CATEGORY_NORMALIZE = {
    "Probleme de compteur": "Probleme de compteur",
    "Problème de compteur": "Probleme de compteur",
    "Fuite d'eau": "Fuite d'eau",
    "Coupure d'eau": "Coupure d'eau",
    "Retard d'intervention": "Retard d'intervention",
    "Facturation": "Facturation",
    "Autre": "Autre",
}

# Exemples synthétiques pour la catégorie "Autre"
AUTRE_EXAMPLES = [
    "Je souhaite signaler un mauvais accueil au niveau de votre agence lors de mon dernier passage",
    "L'agent d'accueil a ete particulierement desagreable et a refuse de prendre mon dossier",
    "Je tiens a signaler un comportement irrespectueux de la part d'un de vos employes",
    "L'eau de mon robinet est de couleur jaunatre et degage une mauvaise odeur depuis hier",
    "L'eau a une odeur tres forte de chlore, pouvez-vous verifier le traitement dans notre secteur",
    "Je voudrais savoir quelle est la procedure pour creer un nouveau branchement d'eau pour une construction",
    "Quelles sont les pieces a fournir pour un nouvel abonnement a l'eau",
    "Je souhaite changer le nom du titulaire sur le contrat d'abonnement suite a un achat immobilier",
    "Il y a une plaque d'egout manquante au milieu de la route, c'est tres dangereux pour les pietons",
    "Un regard d'egout est ouvert devant l'ecole primaire depuis plusieurs jours",
    "Je voudrais obtenir un duplicata de ma facture pour les trois derniers mois",
    "Pouvez-vous m'envoyer un historique de ma consommation des deux dernieres annees",
    "Je souhaite resilier mon abonnement car je demenage dans une autre ville",
    "Le personnel de l'agence est incompetent et m'a mal oriente lors de ma visite",
    "L'eau sent mauvais et a une couleur suspect, est-ce normal",
    "Je veux faire une reclamation sur la qualite du service client de votre agence",
    "L'agent qui est venu chez moi etait impoli et n'a pas effectue correctement son travail",
    "Bonjour je voulais demander comment fonctionne le systeme de paiement en ligne",
    "Je n'arrive pas a me connecter a mon espace client sur votre site web",
    "Votre application mobile ne fonctionne pas correctement depuis la mise a jour",
    "Je souhaite signaler un comportement agressif d'un technicien lors de son intervention",
    "L'eau du robinet a un gout metallique tres prononce depuis quelques jours",
    "Y a-t-il des travaux prevus dans mon quartier qui pourraient expliquer la baisse de pression",
    "Je veux contester le montant de la caution demandee lors de mon nouvel abonnement",
    "Je n'ai recu aucune reponse a mon courrier envoye il y a trois semaines",
    "Votre service client ne repond jamais au telephone, c'est inacceptable",
    "Je veux signaler un probleme de gestion administrative de mon dossier",
    "Ma demande de branchement est en cours depuis 6 mois sans aucune nouvelle",
    "L'etat de la voirie devant chez moi est degrade a cause de vos travaux non repares",
    "Suite aux travaux de canalisation, le trottoir n'a pas ete remis en etat correctement",
]

def normalize_category(cat: str) -> str:
    cat = str(cat).strip()
    return CATEGORY_NORMALIZE.get(cat, "Autre")

def preprocess(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-zàâäéèêëîïôöùûüçœæ0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def load_data(file_path: str) -> pd.DataFrame:
    tmp_path = file_path + ".__tmp__.xlsx"
    try:
        shutil.copy(file_path, tmp_path)
        import openpyxl
        wb = openpyxl.load_workbook(tmp_path, read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        wb.close()
        os.remove(tmp_path)
        headers = rows[0]
        text_col = next((i for i, h in enumerate(headers) if h and str(h).strip().lower() in ['text', 'texte']), None)
        cat_col  = next((i for i, h in enumerate(headers) if h and str(h).strip().lower() == 'categorie'), None)
        if text_col is None or cat_col is None:
            raise ValueError(f"Colonnes manquantes. Headers: {headers}")
        data = [{"texte": row[text_col], "categorie": row[cat_col]} for row in rows[1:] if row[text_col] and row[cat_col]]
        df = pd.DataFrame(data)
        print(f"  [OK] Loaded as Excel (openpyxl) -- {len(df)} rows")
        return df
    except Exception as e:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        print(f"  [FAIL] openpyxl failed: {e}")

    for sep in [";", ","]:
        for text_col in ["texte", "text"]:
            try:
                df = pd.read_csv(file_path, sep=sep, usecols=[text_col, "categorie"], encoding="utf-8")
                df = df.rename(columns={text_col: "texte"})
                print(f"  [OK] Loaded as CSV (sep='{sep}') -- {len(df)} rows")
                return df
            except Exception:
                continue

    raise ValueError(f"Impossible de lire le fichier: {file_path}")

def train():
    candidates = [
        "../reclamations_seaal.csv",
        "../reclamations_seaal.xlsx",
        "../reclamations_seaal (1).csv",
    ]
    data_path = next((p for p in candidates if os.path.exists(p)), None)
    if not data_path:
        print("Error: Aucun fichier de donnees trouve.")
        sys.exit(1)

    print(f"Chargement des donnees depuis: {data_path}")
    df = load_data(data_path)
    df = df.dropna(subset=["texte", "categorie"])
    df["categorie"] = df["categorie"].apply(normalize_category)

    # Ajouter les exemples "Autre" synthetiques
    autre_df = pd.DataFrame({
        "texte": AUTRE_EXAMPLES,
        "categorie": ["Autre"] * len(AUTRE_EXAMPLES)
    })
    df = pd.concat([df, autre_df], ignore_index=True)

    print(f"Total: {len(df)} lignes apres ajout de la categorie 'Autre'.")
    print("Distribution des categories:")
    print(df["categorie"].value_counts().to_string())

    df["clean"] = df["texte"].apply(preprocess)

    le = LabelEncoder()
    df["label"] = le.fit_transform(df["categorie"])

    os.makedirs("modele", exist_ok=True)
    joblib.dump(le, "modele/label_encoder.pkl")
    print("Label encoder sauvegarde.")

    print("Chargement du modele SBERT...")
    sbert_base = SentenceTransformer("dangvantuan/sentence-camembert-base")

    print("Encodage des textes...")
    X_emb = sbert_base.encode(df["clean"].tolist(), show_progress_bar=True, batch_size=32)
    y = df["label"].values

    print("Entrainement du modele SVC...")
    clf = SVC(kernel="rbf", probability=True, C=10, gamma='scale')
    clf.fit(X_emb, y)

    joblib.dump(clf, "modele/sbert_svc_model.pkl")
    print("Modele SVC sauvegarde.")
    print("Entrainement termine!")

if __name__ == "__main__":
    train()
