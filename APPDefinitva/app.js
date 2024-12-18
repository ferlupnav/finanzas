let registros = JSON.parse(localStorage.getItem('registros')) || [];
const totales = {
    Santander: 0,
    "Imagin Supermercado": 0,
    "Imagin Ahorro": 0,
    Efectivo: 0
};

document.getElementById('formulario').addEventListener('submit', function (e) {
    e.preventDefault();

    const tipo = document.getElementById('tipo').value;
    const cuenta = document.getElementById('cuenta').value;
    const categoria = document.getElementById('categoria').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const fecha = document.getElementById('fecha').value;

    if (!monto || !fecha) {
        alert('Por favor, completa todos los campos correctamente.');
        return;
    }

    registros.push({ tipo, cuenta, categoria, monto, fecha });
    localStorage.setItem('registros', JSON.stringify(registros));

    renderRegistros();
    actualizarTotales();

    document.getElementById('formulario').reset();
});

function actualizarTotales() {
    Object.keys(totales).forEach(cuenta => totales[cuenta] = 0);

    registros.forEach(({ tipo, cuenta, monto }) => {
        if (tipo === 'ingreso') {
            totales[cuenta] += monto;
        } else {
            totales[cuenta] -= monto;
        }
    });

    document.getElementById('totalSantander').textContent = `Santander: €${totales.Santander.toFixed(2)}`;
    document.getElementById('totalImaginSuper').textContent = `Imagin Supermercado: €${totales["Imagin Supermercado"].toFixed(2)}`;
    document.getElementById('totalImaginAhorro').textContent = `Imagin Ahorro: €${totales["Imagin Ahorro"].toFixed(2)}`;
    document.getElementById('totalEfectivo').textContent = `Efectivo: €${totales.Efectivo.toFixed(2)}`;
}

function renderRegistros() {
    const tbody = document.getElementById('registros');
    tbody.innerHTML = '';

    registros.forEach((registro, index) => {
        const row = `<tr>
            <td>${registro.tipo}</td>
            <td>${registro.cuenta}</td>
            <td>${registro.categoria}</td>
            <td>€${registro.monto.toFixed(2)}</td>
            <td>${registro.fecha}</td>
            <td>
                <button onclick="editarRegistro(${index})">Editar</button>
                <button onclick="eliminarRegistro(${index})">Eliminar</button>
            </td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function editarRegistro(index) {
    const registro = registros[index];

    document.getElementById('tipo').value = registro.tipo;
    document.getElementById('cuenta').value = registro.cuenta;
    document.getElementById('categoria').value = registro.categoria;
    document.getElementById('monto').value = registro.monto;
    document.getElementById('fecha').value = registro.fecha;

    registros.splice(index, 1);
    renderRegistros();
    actualizarTotales();
}

function eliminarRegistro(index) {
    if (confirm("¿Estás seguro de que quieres eliminar este registro?")) {
        registros.splice(index, 1);
        localStorage.setItem('registros', JSON.stringify(registros));
        renderRegistros();
        actualizarTotales();
    }
}

document.getElementById('descargarExcel').addEventListener('click', () => {
    if (registros.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(registros);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");

    XLSX.writeFile(workbook, "gestion_financiera.xlsx");
});

renderRegistros();
actualizarTotales();

function renderRegistros() {
    const tbody = document.getElementById('registros');
    tbody.innerHTML = '';

    registros.forEach((registro, index) => {
        const isPositive = registro.tipo === 'ingreso';
        const row = `<tr>
            <td>${registro.tipo}</td>
            <td>${registro.cuenta}</td>
            <td>${registro.categoria}</td>
            <td class="monto ${isPositive ? 'positivo' : 'negativo'}">
                €${registro.monto.toFixed(2)}
            </td>
            <td>${registro.fecha}</td>
            <td>
                <button onclick="editarRegistro(${index})">Editar</button>
                <button onclick="eliminarRegistro(${index})">Eliminar</button>
            </td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function descargarExcel() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    // Filtrar los registros por fecha
    const registrosFiltrados = registros.filter((registro) => {
        const fechaRegistro = new Date(registro.fecha);
        return (!fechaInicio || fechaRegistro >= new Date(fechaInicio)) &&
               (!fechaFin || fechaRegistro <= new Date(fechaFin));
    });

    // Calcular totales por cuenta
    const totales = registrosFiltrados.reduce((acum, registro) => {
        acum[registro.cuenta] = (acum[registro.cuenta] || 0) + registro.monto;
        return acum;
    }, {});

    // Crear archivo Excel
    const wb = XLSX.utils.book_new();

    // 1. Añadir registros
    const registrosWS = XLSX.utils.json_to_sheet(registrosFiltrados);
    XLSX.utils.book_append_sheet(wb, registrosWS, 'Registros');

    // 2. Añadir totales por cuenta
    const totalesData = Object.keys(totales).map((cuenta) => ({
        Cuenta: cuenta,
        Total: totales[cuenta].toFixed(2),
    }));
    const totalesWS = XLSX.utils.json_to_sheet(totalesData);
    XLSX.utils.book_append_sheet(wb, totalesWS, 'Totales');

    // Descargar Excel
    XLSX.writeFile(wb, 'finanzas.xlsx');
}

// Filtrar registros por rango de fechas
document.getElementById("filtrarRegistros").addEventListener("click", () => {
    const fechaInicioInput = document.getElementById("filtroFechaInicio").value;
    const fechaFinInput = document.getElementById("filtroFechaFin").value;

    // Validar que ambas fechas estén seleccionadas
    if (!fechaInicioInput || !fechaFinInput) {
        alert("Por favor, selecciona ambas fechas (inicio y fin) para filtrar.");
        return;
    }

    const fechaInicio = new Date(fechaInicioInput);
    const fechaFin = new Date(fechaFinInput);

    // Ajustar la fecha final al final del día para incluir registros de la misma fecha
    fechaFin.setHours(23, 59, 59, 999);

    const registros = JSON.parse(localStorage.getItem("registros")) || [];

    // Filtrar registros dentro del rango de fechas
    const registrosFiltrados = registros.filter((registro) => {
        const fechaRegistro = new Date(registro.fecha);
        return fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
    });

    actualizarTabla(registrosFiltrados);
});

// Modificar color de los valores según sean positivos o negativos
function actualizarTabla(data = null) {
    const registros = data || JSON.parse(localStorage.getItem("registros")) || [];
    const tbody = document.getElementById("registros");
    tbody.innerHTML = "";

    registros.forEach((registro, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${registro.tipo}</td>
            <td>${registro.cuenta}</td>
            <td>${registro.categoria}</td>
            <td style="color: ${registro.monto >= 0 ? 'green' : 'red'};">${registro.monto.toFixed(2)} €</td>
            <td>${registro.fecha}</td>
            <td>
                <button onclick="eliminarRegistro(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });

    if (registros.length === 0) {
        const filaVacia = document.createElement("tr");
        filaVacia.innerHTML = `
            <td colspan="6" style="text-align: center;">No hay registros en este rango de fechas.</td>
        `;
        tbody.appendChild(filaVacia);
    }
}
