# Use an official Python runtime as a parent image
FROM --platform=linux/amd64 python:3.9-slim

# Set environment variables with proper syntax
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    tesseract-ocr \
    libtesseract-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file to the container
COPY requirements.txt .

# Install Python packages with memory optimization
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the container
COPY . /app

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run your application
CMD ["python", "app.py"]