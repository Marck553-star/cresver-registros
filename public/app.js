let workers = [];
let sites = [];
let tasks = [];
let todaySpain = "";
let workerCounts = {};

const recordDate = document.getElementById("recordDate");
const todayBtn = document.getElementById("todayBtn");
const workerSelect = document.getElementById("workerSelect");
const otherWorkerInput = document.getElementById("otherWorkerInput");
const siteSelect = document.getElementById("siteSelect");
const otherSiteInput = document.getElementById("otherSiteInput");
const workFields = document.getElementById("workFields");
const tasksContainer = document.getElementById("tasksContainer");
const addTaskBtn = document.getElementById("addTaskBtn");
const submitBtn = document.getElementById("submitBtn");
const observations = document.getElementById("observations");
const counter = document.getElementById("counter");
const message = document.getElementById("message");

async function init() {
  const todayRes = await fetch("/api/today");
  const todayData = await todayRes.json();
  todaySpain = todayData.today;
  recordDate.value = todaySpain;

  const optionsRes = await fetch("/api/options");
  const options = await optionsRes.json();

  workers = options.workers;
  sites = options.sites;
  tasks = options.tasks;

  fillWorkers();
  fillSites();
  await loadWorkerCounts();
  updateDateRules();
}

function fillWorkers() {
  const selectedValue = workerSelect.value;

  workerSelect.innerHTML = `<option value="">Elegir trabajador...</option>`;

  workers.forEach(worker => {
    const option = document.createElement("option");
    option.value = worker.name;

    const info = workerCounts[worker.name];

    if (info && info.hours > 0) {
      option.textContent = `${worker.name} - ${info.hours}h`;
    } else {
      option.textContent = worker.name;
    }

    workerSelect.appendChild(option);
  });

  workerSelect.value = selectedValue;
}

function fillSites() {
  siteSelect.innerHTML = `<option value="">Elegir obra...</option>`;

  sites.forEach(site => {
    const option = document.createElement("option");
    option.value = site.name === "Otra..." ? "Otra..." : site.id;
    option.textContent = site.name;
    siteSelect.appendChild(option);
  });
}

function createTaskRow() {
  const row = document.createElement("div");
  row.className = "task-row";

  const taskSelect = document.createElement("select");
  taskSelect.className = "task-select";
  taskSelect.innerHTML = `<option value="">Elegir tarea...</option>`;

  tasks.forEach(task => {
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = task.name;
    taskSelect.appendChild(option);
  });

  const hourSelect = document.createElement("select");
  hourSelect.className = "hour-select";
  hourSelect.innerHTML = `<option value="">Horas</option>`;

  for (let i = 0.5; i <= 12; i += 0.5) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} h`;
    hourSelect.appendChild(option);
  }

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "X";

  const otherTaskInput = document.createElement("input");
  otherTaskInput.type = "text";
  otherTaskInput.className = "other-task-input hidden";
  otherTaskInput.placeholder = "Especificar tarea";

  removeBtn.addEventListener("click", () => {
    row.remove();
  });

  taskSelect.addEventListener("change", () => {
    const selectedText = taskSelect.options[taskSelect.selectedIndex].textContent;

    if (selectedText === "VARIOS") {
      otherTaskInput.classList.remove("hidden");
    } else {
      otherTaskInput.classList.add("hidden");
      otherTaskInput.value = "";
    }
  });

  row.appendChild(taskSelect);
  row.appendChild(hourSelect);
  row.appendChild(removeBtn);
  row.appendChild(otherTaskInput);

  tasksContainer.appendChild(row);
}

function updateDateRules() {
  const selectedDate = recordDate.value;

  const workOption = document.querySelector(".work-option");
  const workRadio = document.querySelector('input[value="Día de trabajo"]');

  if (selectedDate > todaySpain) {
    workOption.classList.add("hidden");

    if (workRadio.checked) {
      workRadio.checked = false;
      workFields.classList.add("hidden");
    }
  } else {
    workOption.classList.remove("hidden");
  }
}

function getSelectedRadio(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : null;
}

function clearRadios(name) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
    radio.checked = false;
  });
}

async function loadWorkerCounts() {
  const res = await fetch(`/api/worker-counts?date=${recordDate.value}`);
  const data = await res.json();

  workerCounts = {};

  data.forEach(item => {
    workerCounts[item.worker_name] = {
      total: Number(item.total),
      hours: Number(item.hours)
    };
  });

  fillWorkers();
  updateWorkerColor();
}

function updateWorkerColor() {
  workerSelect.classList.remove(
    "worker-yellow",
    "worker-orange",
    "worker-red",
    "worker-purple"
  );

  Array.from(workerSelect.options).forEach(option => {
    option.classList.remove(
      "worker-yellow",
      "worker-orange",
      "worker-red",
      "worker-purple"
    );

    const count = workerCounts[option.value]?.total || 0;

    if (count === 1) {
      option.classList.add("worker-yellow");
    } else if (count === 2) {
      option.classList.add("worker-orange");
    } else if (count === 3) {
      option.classList.add("worker-red");
    } else if (count >= 4) {
      option.classList.add("worker-purple");
    }
  });

  const workerName = getWorkerName();
  const count = workerCounts[workerName] || 0;

  if (count === 1) {
    workerSelect.classList.add("worker-yellow");
  } else if (count === 2) {
    workerSelect.classList.add("worker-orange");
  } else if (count === 3) {
    workerSelect.classList.add("worker-red");
  } else if (count >= 4) {
    workerSelect.classList.add("worker-purple");
  }
}

function getWorkerName() {
  const selected = workerSelect.value;

  if (selected === "Otro...") {
    return otherWorkerInput.value.trim();
  }

  return selected;
}

function resetFormAfterSubmit() {
  workerSelect.value = "";
  otherWorkerInput.value = "";
  otherWorkerInput.classList.add("hidden");

  clearRadios("recordType");
  clearRadios("food");
  clearRadios("transport");

  siteSelect.value = "";
  otherSiteInput.value = "";
  otherSiteInput.classList.add("hidden");

  tasksContainer.innerHTML = "";
  workFields.classList.add("hidden");

  observations.value = "";
  counter.textContent = "0";

  updateWorkerColor();
}

recordDate.addEventListener("change", async () => {
  updateDateRules();
  await loadWorkerCounts();
});

todayBtn.addEventListener("click", async () => {
  recordDate.value = todaySpain;
  updateDateRules();
  await loadWorkerCounts();
});

workerSelect.addEventListener("change", () => {
  if (workerSelect.value === "Otro...") {
    otherWorkerInput.classList.remove("hidden");
  } else {
    otherWorkerInput.classList.add("hidden");
    otherWorkerInput.value = "";
  }

  updateWorkerColor();
});

otherWorkerInput.addEventListener("input", updateWorkerColor);

siteSelect.addEventListener("change", () => {
  if (siteSelect.value === "Otra...") {
    otherSiteInput.classList.remove("hidden");
  } else {
    otherSiteInput.classList.add("hidden");
    otherSiteInput.value = "";
  }
});

document.querySelectorAll('input[name="recordType"]').forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "Día de trabajo" && radio.checked) {
      workFields.classList.remove("hidden");

      if (tasksContainer.children.length === 0) {
        createTaskRow();
      }
    } else {
      workFields.classList.add("hidden");
    }
  });
});

addTaskBtn.addEventListener("click", createTaskRow);

observations.addEventListener("input", () => {
  counter.textContent = observations.value.length;
});

submitBtn.addEventListener("click", async () => {
  message.textContent = "";
  message.className = "";

  const workerName = getWorkerName();
  const recordType = getSelectedRadio("recordType");

  if (!recordDate.value) {
    showMessage("Selecciona un día", "error");
    return;
  }

  if (!workerName) {
    showMessage("Selecciona o escribe un trabajador", "error");
    return;
  }

  if (!recordType) {
    showMessage("Selecciona un tipo de registro", "error");
    return;
  }

  let selectedTasks = [];
  let siteId = null;
  let otherSiteName = "";

  if (recordType === "Día de trabajo") {
    siteId = siteSelect.value;

    if (!siteId) {
      showMessage("Selecciona una obra", "error");
      return;
    }

    if (siteId === "Otra...") {
      otherSiteName = otherSiteInput.value.trim();

      if (!otherSiteName) {
        showMessage("Escribe el nombre de la obra", "error");
        return;
      }

      siteId = null;
    }

    const taskRows = document.querySelectorAll(".task-row");
    let hasError = false;
    let hasVariosError = false;

    taskRows.forEach(row => {
      const taskSelectRow = row.querySelector(".task-select");
      const hourSelectRow = row.querySelector(".hour-select");

      const taskId = taskSelectRow.value;
      const hours = hourSelectRow.value;
      const taskName = taskSelectRow.options[taskSelectRow.selectedIndex].textContent;
      const otherTaskName = row.querySelector(".other-task-input")?.value.trim() || "";

      if (!taskId || !hours) {
        hasError = true;
        return;
      }

      if (taskName === "VARIOS" && !otherTaskName) {
        hasVariosError = true;
        return;
      }

      selectedTasks.push({
        taskId,
        hours,
        otherTaskName
      });
    });

    if (hasError) {
      showMessage("Todas las tareas deben tener horas seleccionadas", "error");
      return;
    }

    if (hasVariosError) {
      showMessage("Especifica la tarea cuando selecciones VARIOS", "error");
      return;
    }

    if (selectedTasks.length === 0) {
      showMessage("Añade al menos una tarea con horas", "error");
      return;
    }
  }

  let finalSiteName = "";

if (recordType === "Día de trabajo") {
  if (siteSelect.value === "Otra...") {
    finalSiteName = otherSiteInput.value.trim();
  } else {
    finalSiteName = siteSelect.options[siteSelect.selectedIndex].textContent;
  }
}

const body = {
  recordDate: recordDate.value,
  workerName,
  recordType,
  siteName: finalSiteName,
  tasks: selectedTasks,
  food: getSelectedRadio("food"),
  transport: getSelectedRadio("transport"),
  observations: observations.value
};

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    showMessage(data.error || "Error al registrar", "error");
    return;
  }

  showMessage(data.message, "success");

  await loadWorkerCounts();
  resetFormAfterSubmit();
});

function showMessage(text, type) {
  message.textContent = text;
  message.className = type;
}

init();