# Praelocate

### _A home relocation tool_

A web-app that would find the best location to find a house given certain significant locations as input.

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
