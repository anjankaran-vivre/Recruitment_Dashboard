module.exports = {
  apps: [
    {
      name: "Recuiter-Dashboard-Backend-8080",
      script: "backend/build/recruit_backend.exe",
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
