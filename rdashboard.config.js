module.exports = {
  apps: [
    {
      name: "Recuiter-Dashboard-Backend-8080",
      script: "backend/build/transcript.exe",
      env: { PORT: 8080 }
    },
    {
      name: "Recruiter-Frontend-5063",
      script: "npm",
      args: "run dev",
      cwd: "frontend"
    },
  ]
};
