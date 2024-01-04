FROM mcr.microsoft.com/devcontainers/python:3.11-bullseye

WORKDIR /workspace

RUN apt-get update && rm -rf /var/lib/pk/lists/*
RUN pip install --upgrade pip && rm -rf /root/.cache/pip/*

ENV PIPENV_VENV_IN_PROJECT=1