# PANDU-NELAYAN — Railway Deployment
# This Dockerfile builds the React frontend and runs the Python FastAPI backend

FROM node:20-slim AS frontend-build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# --- Python runtime ---
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code & data
COPY app.py .
COPY data/ data/
COPY public/ public/

# Copy the built frontend from the Node stage
COPY --from=frontend-build /app/dist/ dist/

EXPOSE 8000

# Railway sets PORT env var automatically
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
