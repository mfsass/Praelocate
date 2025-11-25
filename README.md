# Praelocate
### _A home relocation tool_

A web-app that would find the best location to find a house given certain significant locations as input.

![image](https://user-images.githubusercontent.com/100954643/199354912-b18be7f5-781f-4150-bd93-49348ddbfb81.png)

## 🚀 New Features

**Easy Setup**: On first launch, you'll be guided through a simple setup page where you can enter your Google Maps API key. No more configuration files needed - just paste your key and start using the app!

**User-Friendly**: The API key is stored locally in your browser, so you only need to enter it once. Anyone can now use this tool with their own Google Maps API key.

## Authors:

- Jacques le Roux
- Markus Sass
- Sam Sorour
- Brandon Spiver
- Willem Wannenburg

## Stack:

- Backend: simple Flask API
- Frontend: React app

## Requirements:

- Python 3.x
- NodeJS
- Google Maps API Key (see setup instructions below)

## Environment setup:

### Backend

1. Setup virtual environment:

   `$ cd backend`

   `$ python -m venv .venv`

1. Activate virtual environment for:

   Windows:

   `$ .\.venv\Scripts\activate`

   Linux/Mac:

   `$ source .venv/bin/activate`

1. Now there should be a green `(.venv)` tag at the front of the terminal line
1. Install requirements (this includes flask):

   `$ pip install -r requirements.txt`

### Frontend

1. Install packages:

   `$ cd frontend`

   `$ npm install`

   `$ npm install --save @react-google-maps/api`

## Execution

### Backend

1. Open a new terminal instance in backend directory
2. Activate the venv as explained above
3. Start the flask app:

   `$ flask run`

### Test cases

Run:
`$ python -m unittest test_app.py`

### Frontend

1. Open a new terminal instance in frontend directory
2. Start the react app:

   `$ npm start`

## Getting a Google Maps API Key:

When you first open the application, you'll see a setup page asking for your Google Maps API key.

### Steps to get your API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Distance Matrix API
4. Go to "Credentials" and create an API key
5. Copy the API key and paste it in the setup page

**Note**: Your API key is stored locally in your browser and is never sent to any server except Google's APIs.

## Workflow:

tldr: <b>pull from</b> development, <b>merge into</b> development

1. Make sure you are on your own branch with `$ git status`
1. Pull from development:

   `$ git pull origin development`

1. Commit to your own branch (no `$ git add *`) with sensible commit messages
1. When you are finished working, merge into development (not pull from your branch)

   `$ git switch development`

   `$ git merge <your banch>` (fix merge issues)

   `$ git push origin development`
