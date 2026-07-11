module.exports = {
  apps: [
    {
      name: "Recuiter-Backend-8080",
      script: "backend/build/recruit_backend.exe",
      cwd: "backend",
      env: { PORT: 8080 }
    },
    {
      name: "Recruiter-Frontend-5081",
      script: "npm",
      args: "run dev",
      cwd: "frontend"
    },
  ]
};
