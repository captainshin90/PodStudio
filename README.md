# AI Podcast Studio (PodStudio)

A modern web application that automatically generates engaging podcast conversations from URLs or news topics using AI. Powered with [podcastfy.ai](http://podcastfy.ai).

## Key Features

- **Custom Podcast Generation**: Generate podcasts from multiple URLs, transcripts, or uploaded documents.
- **Content Management**: Built-in management for podcasts, transcripts, AI prompts, and documents.
- **Real-time Updates**: Real-time progress tracking using WebSocket integration.
- **Modern UI/UX**: Beautiful user interface built with React, Vite, Tailwind CSS, and standard shadcn/ui components.
- **Provider & Model Management**: GUI to manage API keys and various Generative AI models.
- **Text-to-Speech**: Support for multiple TTS providers and customizable voices/styles.
- **Firebase Integration**: Secure Authentication, robust Firestore database, and Cloud Storage for artifacts.

## Screenshots
<img src="public/screenshots/main1.png" alt="Home" width="600">

<img src="public/screenshots/main2.png" alt="Podcast" width="600">

<img src="public/screenshots/main3.png" alt="Episodes" width="600">


## Live Demo
[https://podstudio.fly.dev/](https://podstudio.fly.dev/)

There's no user authentication, but it asks for an access code. Please post an issue with your email address and I'll send you the code. This is so that I can control myhosting cost.

## Technologies Used

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, React Router, Firebase Web SDK
- **Backend:** Python 3.11+, Flask, Socket.IO, podcastfy
- **Package Managers:** Bun (Frontend), Pip (Backend)
- **Deployment:** Fly.io

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Python](https://www.python.org/) 3.11+
- [Bun](https://bun.sh/)
- [Fly.io CLI](https://fly.io/docs/flyctl/install/) (for deployment)

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/captainshin90/PodStudio.git
   cd PodStudio
   ```

2. **Set up Python environment:**
   ```bash
   # Create and activate virtual environment
   python -m venv .venv

   # Activate on Windows:
   .\.venv\Scripts\activate
   # Or on Unix/MacOS:
   source .venv/bin/activate

   # Upgrade pip and install backend dependencies
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Install Frontend dependencies:**
   Ensure `bun` is installed globally.
   ```bash
   npm install -g bun
   bun upgrade

   # Install standard dependencies
   bun install
   ```

4. **Environment Variables:**
   Create a `.env` file based on your `.env.example`.
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure you configure your Firebase credentials, API keys, and environment-specific settings in the `.env` file.*

5. **Start the development servers:**
   ```bash
   # Starts both the Vite frontend and the Flask backend concurrently
   bun dev
   ```
   The frontend will be available at `http://localhost:5173`.
   The backend API will run on `http://127.0.0.1:8080`.

## Debugging

You can debug the frontend and backend separately:

- **Frontend (Vite):**
  - Run `bun dev:frontend` to start only the Vite server.
  - Launch your browser/debugger against `http://localhost:5173/`.
- **Backend (Flask):**
  - Run the backend manually via your IDE or run `python app.py` (runs on port 8080).
  - Test the environment health endpoint locally via `http://localhost:8080/api/test-env`.

## Production Build

To build the optimized production frontend:
```bash
bun run build
```

## Deployment with Fly.io

The project uses [Fly.io](https://fly.io/) for containerized hosting. 

1. **Install Fly CLI:**
   - Windows (PowerShell):
     ```powershell
     pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
     ```
   - macOS / Linux:
     ```bash
     curl -L https://fly.io/install.sh | sh
     ```

2. **Login and Setup:**
   ```bash
   fly auth login
   fly launch
   ```

3. **Configure Secrets:**
   Configure any necessary secure API tokens and environment `.env` keys for your production environment.
   ```bash
   # Example: Setting a secret
   fly secrets set API_TOKEN=your_generated_token
   # Add your Firebase context and other ENV keys correspondingly
   ```

4. **Storage Volume:**
   Provide persistent storage for generated audio and artifacts:
   ```bash
   fly volumes create audio_data --size 1
   ```

5. **Deploy Application:**
   Deploy the application. The system will automatically build both the React frontend and bundle it with the Flask backend.
   ```bash
   fly deploy
   ```

## Project Structure

```text
.
├── src/                  # Frontend React source code
│   ├── components/       # shadcn/ui and custom components
│   ├── pages/            # Application routes
│   └── lib/              # Utility functions and Firebase config
├── app.py                # Main Flask backend application core
├── requirements.txt      # Python backend dependencies
├── package.json          # Node/Bun dependencies & standard scripts
├── vite.config.ts        # Vite local development configuration
├── tailwind.config.js    # Styling framework configuration
├── Dockerfile            # Container deployment instructions
└── fly.toml              # Fly.io deployment configuration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Contact

[admin@kapshin.com](mailto:admin@kapshin.com)
