FROM python:3.9
# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install in batches
COPY requirements.txt .
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0
RUN pip install --no-cache-dir flask werkzeug flask-cors pandas xlsxwriter
RUN pip install --no-cache-dir opencv-python pytesseract numpy
RUN pip install --no-cache-dir ultralytics

# Copy the application code
COPY . /app

# Expose port and run application
EXPOSE 5000
CMD ["python", "app.py"]