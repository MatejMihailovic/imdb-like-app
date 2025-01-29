# Use Python 3.12 slim image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Run Django's development server on port 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
