require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function getSpainDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

app.get("/api/today", (req, res) => {
  res.json({ today: getSpainDate() });
});

app.get("/api/options", async (req, res) => {
  try {
    const workers = await sql`SELECT * FROM workers ORDER BY id`;
    const sites = await sql`SELECT * FROM work_sites ORDER BY name`;
    const tasks = await sql`SELECT * FROM tasks ORDER BY name`;

    res.json({ workers, sites, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error cargando opciones" });
  }
});

app.get("/api/worker-counts", async (req, res) => {
  try {
    const { date } = req.query;

    const rows = await sql`
      SELECT 
        trabajador AS worker_name,
        COUNT(*)::int AS total,
        COALESCE(SUM(horas_totales), 0)::numeric AS hours
      FROM daily_records
      WHERE fecha = ${date}
      GROUP BY trabajador
    `;

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error cargando contadores" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const {
      recordDate,
      workerName,
      recordType,
      siteName,
      tasks,
      food,
      transport,
      observations
    } = req.body;

    if (!recordDate || !workerName || !recordType) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (recordType === "Día de trabajo") {
      if (!siteName) {
        return res.status(400).json({ error: "Debes seleccionar o escribir una obra" });
      }

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: "Debes añadir al menos una tarea" });
      }

      for (const task of tasks) {
        if (!task.taskId || !task.hours) {
          return res.status(400).json({ error: "Todas las tareas deben tener horas" });
        }
      }
    }

    let totalHours = 0;
    let trabajoText = null;

    if (recordType === "Día de trabajo" && Array.isArray(tasks)) {
      totalHours = tasks.reduce((sum, task) => {
        return sum + Number(task.hours || 0);
      }, 0);

      const taskNames = [];

      for (const task of tasks) {
        const taskResult = await sql`
          SELECT name 
          FROM tasks 
          WHERE id = ${task.taskId}
        `;

        let taskName = taskResult[0]?.name || "";

        if (taskName === "VARIOS" && task.otherTaskName) {
          taskName = task.otherTaskName;
        }

        taskNames.push(`${taskName} (${task.hours}h)`);
      }

      trabajoText = taskNames.join(", ");
    }

    const inserted = await sql`
      INSERT INTO daily_records (
        fecha,
        trabajador,
        tipo_registro,
        obra,
        comida,
        transporte,
        observaciones,
        horas_totales,
        trabajo
      )
      VALUES (
        ${recordDate},
        ${workerName},
        ${recordType},
        ${siteName || null},
        ${food || null},
        ${transport || null},
        ${observations || null},
        ${totalHours},
        ${trabajoText}
      )
      RETURNING id
    `;

    const recordId = inserted[0].id;

    if (recordType === "Día de trabajo" && Array.isArray(tasks)) {
      for (const task of tasks) {
        await sql`
          INSERT INTO record_tasks (
            record_id,
            task_id,
            hours,
            other_task_name
          )
          VALUES (
            ${recordId},
            ${task.taskId},
            ${task.hours},
            ${task.otherTaskName || null}
          )
        `;
      }
    }

    res.json({ message: "Trabajador fichado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el día" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});