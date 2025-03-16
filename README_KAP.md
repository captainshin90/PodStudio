### AI Podcast Studio

To start .venv:
.\.venv\Scripts\activate

> bun run dev (not debugging) 
> bun run dev:frontend
  > Debug: Launch Chrome against localhost
  > Debug: Python: Flask app.py
> bun run build
> git add .
> git commit -m "fix file upload"
> git push -u origin main
> fly auth login
> fly deploy

### Key Info 

Admin URL: https://fly.io/apps/podstudio

Deployed site: https://podstudio.fly.dev/

- This project is running in local .venv (Windows) with Python 3.13.2
- Activate the venv (in Windows):
  > .\.venv\Scripts\activate
  (.venv) C:\SRC\PodStudio> 

- Frontend is vite app.tsx - Vite/React/Tailwind/shadcn/WebSocket
- Backend is Flask app.py - Flask/Python/NodeJs/Bun

- Need to update app.py with server's IP address and port

- To install the customized podcastfy package:
xx (.venv) > pip install C:/SRC/podcastfy/dist/podcastfy-0.4.1.tar.gz
xx don't need, use standard podcastfy package 

- To build the development frontend and backend:
  (.venv) > C:\SRC\podstudio> bun dev 

- To build the production frontend and backend:
  (.venv) > C:\SRC\podstudio> bun run build

- To regenerate the bun.lockb file, simply run bun install in your project directory. This will re-evaluate your dependencies and create a new lockfile based on your package.json. 
  (.venv> > bun install

- To regenerate package-lock.json, run:
  (.venv) > npm install --package-lock 

- Open browser: 
  http://localhost:5173

### Debugging 

- look for error messages in both terminals and debug console

- to debug frontend (Vite): 
    - in the main .venv terminal:
    (.venv)> bun dev   # runs both frontend and backend together
    - from Run Debug: select "Launch Chrome against localhost
    - opens a second debug terminal

- To debug backend (App.py):
    - in the main .venv terminal: 
    (.venv) > bun dev:frontend   # will run vite on http://localhost:5173/
    - from Run Debug: select "Python: Flask app.py"
      - will run app.py on http://127.0.0.1:8080 
      - opens a second debug terminal

- OR, open package.json, choose >Debug button and choose configuration

### To Build Production

(.venv) > bun run build

### Setting up GitHub repo

- To create a new GitHub repo: https://github.com/captainshin90/<new-repo>
  (.venv) > git remote remove origin   # remove old clone origin
  (.venv) > git init
  (.venv) > git remote add origin https://github.com/captainshin90/PodStudio.git  # add my private repo as the origin 
  (.venv) > git config --global --add safe.directory /workspaces/<new-repo>  # when working with .devcontainer

- To check in code to repo: 
  (.venv) > git add .
  (.venv) > git branch -M main  # when local code has no branch
  (.venv) > git commit -m "Describe code change"  #
  (.venv) > git push -u origin main               # push changed files to GitHub

- To remove a previously committed file from the repo (but not delete locally):
  > git rm --cashed <filename>   (git rm -r --cached <folder/>)


XXX Deploy to Netlify
- for Bun, the publishing site is "static"
- pull from GitHub https://github.com/captainshin90/PodStudio
> npm install netlify-cli -g
> netlify login
> netlify init
> netlify env:import .env  - name of .env file 


### Prerequisites

- Node.js 18+
- Python 3.11 (it works in 3.13.2)
- pip
- bun
- pyenv  (don't need)
- Poetry (optional but recommended)
- Fly.io CLI (installed)


### Development Setup

1. Clone the repository:

```bash
(done) git clone https://github.com/giulioco/openpod
(done) cd openpod
```

2. Set up Python environment:

# Running in local .venv, not Dev Container. But my local machine has python 3.13.2.
(skip) # Need pyenv to run python 3.11.7

## Already running in a dev.container, so skip pyenv and venv?

(skip) # Install Python 3.11.7 with shared libraries enabled
```bash
# env PYTHON_CONFIGURE_OPTS="--enable-shared" pyenv install 3.11.7
# pyenv local 3.11.7

# Create and activate virtual environment
# (done) python -m venv .venv
# source .venv/bin/activate  # On Unix/MacOS
# or
# (done) .\.venv\Scripts\activate  # On Windows

# Upgrade pip
(done) pip install --upgrade pip

3. Install backend dependencies:
(done) pip install -r requirements.txt

4.5 Install bun:
(done) npm install -g bun
(done) bun upgrade

# Install frontend dependencies
(done) bun install

# when running with Python 3.12+ build fails due to deprecated audioop. Need to run: 
(done) pip install audioop-lts

# install Vite
(done) npm install -D vite

# install Concurrently
(done) pip install concurrently

4. Set up environment variables:

(done) cp .env.example .env
# Edit .env with your configuration

5. For Windows, need to edit package.json to change "python app.py" to "py app.py"

6. Start the development servers:
bun dev

The application will be available at `http://localhost:5173`

With Google Cloud Shell, select Web Preview link but change the port to 5173.


### Deployment with Fly.io

https://fly.io/docs/flyctl/install/

1. Install the Fly CLI:
Windows: 
> pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

(skip) curl -L https://fly.io/install.sh | sh

2. Login to Fly:
fly auth login

3. Create a new app:
fly launch

4. Set up environment variables:
# Generate a secure API token (from .devcontainer Linux)
(done) openssl rand -hex 32
c07f18dfc8b0ade00a085f6c81407078dd5c398661c5c240e6fdb2f70e939c09
# Set it in Fly.io
(done) fly secrets set API_TOKEN= c07f18dfc8b0ade00a085f6c81407078dd5c398661c5c240e6fdb2f70e939c09

(done) run fly secrets set for all KEYS in .env

5. Create a volume for audio files:
(done) fly volumes create audio_data --size 1

6. Deploy the application:
Deploy to Fly.io (this will automatically build both frontend and backend)
(done) fly deploy

Deploy Token: name: "kapremote"
FlyV1 fm2_lJPECAAAAAAACGlqxBAFOrnNuXvWoXr6YHcP2nTrwrVodHRwczovL2FwaS5mbHkuaW8vdjGWAJLOAA9nCB8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDxbonrVi192QZH5w0ZxRxigF0/cXarVnyNbb14TlFksrdi55iCEmc3DMCCcT5m3Ot3IkMHEBp+ay2Z8APDETlvjGr0yVYed3pW8GZCyWRNQBD8InMX0UGSV6uv2/41xecJ1xY+wg34lArcEtiNYVVY+7vp+4KfUg2D2crF493o6a+OL38XmTh+U3CztKg2SlAORgc4Aam12HwWRgqdidWlsZGVyH6J3Zx8BxCBD+VH6EgXoa59UWzfdPZSLq35Pm/F3NIhz31lIng+/bg==,fm2_lJPETlvjGr0yVYed3pW8GZCyWRNQBD8InMX0UGSV6uv2/41xecJ1xY+wg34lArcEtiNYVVY+7vp+4KfUg2D2crF493o6a+OL38XmTh+U3CztKsQQwCeM0pLhj2FfwlOpYxhZpsO5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZgEks5n1jgEzwAAAAEjzlYiF84ADs7oCpHOAA7O6AzEEEQQt4RFvfQQMbho4QRrf/rEIEN/K1Mwn1OE1D09uvBtH7O0gPXAcIFcdl8gEYSRrtfM

Run `fly tokens create deploy -x 999999h` to create a token and set it as the FLY_API_TOKEN secret in your GitHub repository settings
See https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions


Issues with Bun lock file:
https://bun.sh/blog/bun-lock-text-lockfile
- bun.lock is text file new format
- bun.lockb is binary

How to deploy .env file to Fly.io:
- use command: fly secrets set API_KEY=....
- or use Fly.io admin console

