FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for psycopg2 (PostgreSQL adapter for supabase) && clear docker cashe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "run:app"]
