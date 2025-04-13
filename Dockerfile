# Use an official Python runtime as a parent image
FROM --platform=linux/amd64 python:3.9-slim

# Set environment variables (optional but useful for Python)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file to the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    tesseract-ocr \
    libtesseract-dev

# Copy the rest of the application code to the container
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . /app
WORKDIR /app

# Expose the port the app runs on (5000 as per our Flask example)
EXPOSE 5000

# Define the command to run your application
CMD ["python", "app.py"]
