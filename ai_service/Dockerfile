FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Initialize/Train the model if it doesn't exist
# RUN python train.py

# Les fournisseurs Cloud (Google Cloud Run, Render, Koyeb) utilisent la variable d'environnement PORT.
ENV PORT=8000
EXPOSE $PORT

# Utilisation de la forme shell pour que la variable d'environnement $PORT soit interprétée
CMD uvicorn app:app --host 0.0.0.0 --port $PORT
