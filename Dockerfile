FROM python:3.11-slim

RUN mkdir /app
WORKDIR /app

# Set environment variables 
# Prevents Python from writing pyc files to disk
ENV PYTHONDONTWRITEBYTECODE=1
#Prevents Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1 

RUN apt-get update && apt-get install -y libpq-dev gcc
RUN pip install --upgrade pip 

COPY requirements.txt  /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "FinanceWatcher.wsgi:application"]