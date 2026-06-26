import { useState, useEffect, useMemo } from 'react'
import { db } from '../config/firebase'
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
import * as XLSX from 'xlsx'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'

const PUEDEN_ELIMINAR = ['irodriguez@enec.gob.gt', 'domain@enec.gob.gt']

export default function Dashboard() {
  const { user } = useAuth()
  const puedeEliminar = PUEDEN_ELIMINAR.includes(user?.email?.toLowerCase())
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [carreraCompletaFilter, setCarreraCompletaFilter] = useState('')
  const [anioFilter, setAnioFilter] = useState('')
  const [cicloFilter, setCicloFilter] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'inscripciones'))
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setInscripciones(data)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const ciclos = useMemo(() => {
    const set = new Set(inscripciones.map(i => i.ciclo).filter(Boolean))
    return [...set].sort()
  }, [inscripciones])

  const opcionesCarrera = useMemo(() => {
    const set = new Set()
    inscripciones.forEach(i => {
      if (i.subcarrera) {
        set.add(`${i.carrera} - ${i.subcarrera}`)
      } else if (i.carrera) {
        set.add(i.carrera)
      }
    })
    return [...set].sort()
  }, [inscripciones])

  const filtered = useMemo(() => {
    return inscripciones.filter(i => {
      const q = search.toLowerCase().trim()
      const nombre = i.nombre_completo || `${i.nombres || ''} ${i.apellidos || ''}`.trim()
      const carreraCompleta = i.subcarrera ? `${i.carrera} - ${i.subcarrera}` : i.carrera
      const matchesSearch = !q
        || i.dpi?.toLowerCase().includes(q)
        || nombre.toLowerCase().includes(q)
        || i.telefono?.toLowerCase().includes(q)
        || carreraCompleta.toLowerCase().includes(q)
        || i.ciclo?.toLowerCase().includes(q)
        || i.no_boleta?.toLowerCase().includes(q)
        || i.correlativo?.toLowerCase().includes(q)
        || i.subcarrera?.toLowerCase().includes(q)

      let matchesCarrera = true
      if (carreraCompletaFilter) {
        const parts = carreraCompletaFilter.split(' - ')
        if (parts.length === 2) {
          matchesCarrera = i.carrera === parts[0] && i.subcarrera === parts[1]
        } else {
          matchesCarrera = i.carrera === carreraCompletaFilter
        }
      }
      const matchesAnio = !anioFilter || i.fecha_boleta?.startsWith(anioFilter)
      const matchesCiclo = !cicloFilter || i.ciclo === cicloFilter

      let matchesFecha = true
      if (fechaDesde && i.fecha_boleta) matchesFecha = matchesFecha && i.fecha_boleta >= fechaDesde
      if (fechaHasta && i.fecha_boleta) matchesFecha = matchesFecha && i.fecha_boleta <= fechaHasta

      return matchesSearch && matchesCarrera && matchesAnio && matchesCiclo && matchesFecha
    })
  }, [inscripciones, search, carreraCompletaFilter, anioFilter, cicloFilter, fechaDesde, fechaHasta])

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [cleaning, setCleaning] = useState(false)
  const [modal, setModal] = useState({ open: false, title: '', message: '' })
  const [pendingClean, setPendingClean] = useState(null)

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, page, rowsPerPage])

  const confirmClean = () => {
    const hasFilter = carreraCompletaFilter || anioFilter || cicloFilter || fechaDesde || fechaHasta
    const label = hasFilter
      ? `los ${filtered.length} registros filtrados`
      : `TODOS los ${filtered.length} registros`

    setPendingClean(() => async () => {
      setCleaning(true)
      try {
        await Promise.all(filtered.map(i => deleteDoc(doc(db, 'inscripciones', i.id))))
        setInscripciones(prev => prev.filter(i => !filtered.find(f => f.id === i.id)))
        setSearch('')
        setCarreraCompletaFilter('')
        setAnioFilter('')
        setCicloFilter('')
        setFechaDesde('')
        setFechaHasta('')
      } catch (error) {
        console.error('Error al limpiar:', error)
        setModal({ open: true, title: 'Error', message: 'Error al eliminar los registros' })
      } finally {
        setCleaning(false)
      }
    })

    setModal({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Eliminar ${label}? Esta acción no se puede deshacer.`,
      confirm: true,
    })
  }

  const handleConfirmClean = async () => {
    setModal({ open: false, title: '', message: '' })
    if (pendingClean) await pendingClean()
    setPendingClean(null)
  }

  const exportToExcel = () => {
    const data = filtered.map(i => ({
      'DPI/CUI': i.dpi,
      'Nombre completo': i.nombre_completo || `${i.nombres || ''} ${i.apellidos || ''}`.trim(),
      'No. Boleta': i.no_boleta,
      'N° Correlativo': i.correlativo,
      Teléfono: i.telefono,
      Carrera: i.subcarrera ? `${i.carrera} - ${i.subcarrera}` : i.carrera,
      Ciclo: i.ciclo,
      'Fecha boleta': i.fecha_boleta,
      'Constancia': i.boletaUrl,
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones')
    XLSX.writeFile(wb, `inscripciones_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (loading) return <div className="loading">Cargando inscripciones...</div>

  return (
    <div className="dashboard-page">
      <h1>Panel de Inscripciones</h1>

      <div className="dashboard-filters">
        <input
          className="search-input"
          type="text"
          placeholder="Buscar por DPI, nombre, boleta, correlativo..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="filter-select"
          value={carreraCompletaFilter}
          onChange={e => { setCarreraCompletaFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todas las carreras</option>
          {opcionesCarrera.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          className="search-input"
          type="text"
          placeholder="Filtrar por año (ej: 2025)"
          value={anioFilter}
          onChange={e => { setAnioFilter(e.target.value); setPage(1) }}
        />
        <select
          className="filter-select"
          value={cicloFilter}
          onChange={e => { setCicloFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todos los ciclos</option>
          {ciclos.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          className="search-input"
          type="date"
          value={fechaDesde}
          onChange={e => { setFechaDesde(e.target.value); setPage(1) }}
          placeholder="Fecha desde"
          title="Fecha boleta desde"
        />
        <input
          className="search-input"
          type="date"
          value={fechaHasta}
          onChange={e => { setFechaHasta(e.target.value); setPage(1) }}
          placeholder="Fecha hasta"
          title="Fecha boleta hasta"
        />
      </div>

      <div className="dashboard-bar">
        <p className="dashboard-count">{filtered.length} inscripción(es)</p>
        <div className="dashboard-actions">
          <button className="btn-export" onClick={exportToExcel}>
            Exportar a Excel
          </button>
          {puedeEliminar && filtered.length > 0 && (
            <button className="btn-clean" onClick={confirmClean} disabled={cleaning}>
              {cleaning ? 'Eliminando...' : 'Limpiar filtrados'}
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">No se encontraron resultados</p>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>DPI/CUI</th>
                <th>Nombre completo</th>
                <th>No. Boleta</th>
                <th>N° Correlativo</th>
                <th>Teléfono</th>
                <th>Carrera</th>
                <th>Ciclo</th>
                <th>Fecha boleta</th>
                <th>Boleta</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(i => (
                <tr key={i.id}>
                  <td>{i.dpi}</td>
                  <td>{i.nombre_completo || `${i.nombres || ''} ${i.apellidos || ''}`.trim()}</td>
                  <td>{i.no_boleta}</td>
                  <td>{i.correlativo}</td>
                  <td>{i.telefono}</td>
                  <td>{i.subcarrera ? `${i.carrera} - ${i.subcarrera}` : i.carrera}</td>
                  <td>{i.ciclo}</td>
                  <td>{i.fecha_boleta}</td>
                  <td>
                    <a href={i.boletaUrl} target="_blank" rel="noopener noreferrer">Ver</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <select
              className="rows-select"
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="pagination-info">
              Página {page} de {totalPages}
            </span>
            <div className="pagination-buttons">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>« Anterior</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={p === page ? 'active' : ''}
                  onClick={() => setPage(p)}
                >{p}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente »</button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmLabel="Eliminar"
        onConfirm={modal.confirm ? handleConfirmClean : undefined}
        onCancel={() => setModal({ open: false, title: '', message: '' })}
      />
    </div>
  )
}
