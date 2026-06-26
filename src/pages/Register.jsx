import { useState } from 'react'
import { db } from '../config/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/Modal'

const opcionesSubcarrera = {
  'Técnico en Enfermería': ['Primer año', 'Segundo año', 'Tercer año'],
  'Licenciatura en Enfermería': ['Cuarto año', 'Quinto año', 'Ejercicio Profesional Supervisado', 'Tésis'],
  'Auxiliares de Enfermería': ['Sección A', 'Sección B', 'Sección C', 'Sección D', 'Sección E', 'Sección F'],
}

const initialForm = {
  dpi: '',
  nombre_completo: '',
  telefono: '',
  carrera: '',
  subcarrera: '',
  no_boleta: '',
  correlativo: '',
  fecha_boleta: '',
  ciclo: '',
}

export default function Register() {
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [boletaUrl, setBoletaUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState({ open: false, title: '', message: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value, ...(name === 'carrera' ? { subcarrera: '' } : {}) })
  }

  const openUploadWidget = () => {
    const widget = window.cloudinary?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        maxFileSize: 5 * 1024 * 1024,
        clientAllowedFormats: ['image'],
        theme: 'minimal',
      },
      (error, result) => {
        if (!error && result.event === 'success') {
          setBoletaUrl(result.info.secure_url)
        }
      }
    )
    widget?.open()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'inscripciones'), {
        ...form,
        boletaUrl,
        registeredBy: user.email,
        createdAt: new Date(),
      })
      setModal({ open: true, title: 'Éxito', message: 'Inscripción registrada exitosamente' })
      setForm(initialForm)
      setBoletaUrl('')
    } catch (error) {
      console.error('Error al registrar:', error)
      setModal({ open: true, title: 'Error', message: 'Error al registrar la inscripción' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-page">
      <h1>Formulario de Inscripción</h1>
      <form onSubmit={handleSubmit} className="register-form">
        <label>
          DPI/CUI
          <input name="dpi" placeholder="0000 00000 0000" value={form.dpi} onChange={handleChange} required />
        </label>
        <label>
          Nombre completo
          <input name="nombre_completo" placeholder="Nombres y apellidos" value={form.nombre_completo} onChange={handleChange} required />
        </label>
        <label>
          Teléfono
          <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} required />
        </label>
        <label>
          Carrera
          <select name="carrera" value={form.carrera} onChange={handleChange} required>
            <option value="">Seleccionar carrera</option>
            <option value="Técnico en Enfermería">Técnico en Enfermería</option>
            <option value="Licenciatura en Enfermería">Licenciatura en Enfermería</option>
            <option value="Auxiliares de Enfermería">Auxiliares de Enfermería</option>
            <option value="Laboratorio Clínico">Laboratorio Clínico</option>
          </select>
        </label>
        {form.carrera && form.carrera !== 'Laboratorio Clínico' && (
          <label>
            {form.carrera === 'Auxiliares de Enfermería' ? 'Sección' : 'Año'}
            <select name="subcarrera" value={form.subcarrera} onChange={handleChange} required>
              <option value="">Seleccionar</option>
              {opcionesSubcarrera[form.carrera]?.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          Ciclo
          <select name="ciclo" value={form.ciclo} onChange={handleChange} required>
            <option value="">Seleccionar ciclo</option>
            <option value="Primer Ciclo">Primer Ciclo</option>
            <option value="Segundo Ciclo">Segundo Ciclo</option>
          </select>
        </label>
        <label>
          No. Boleta
          <input name="no_boleta" placeholder="Número de boleta" value={form.no_boleta} onChange={handleChange} />
        </label>
        <label>
          N° Correlativo
          <input name="correlativo" placeholder="Número correlativo" value={form.correlativo} onChange={handleChange} />
        </label>
        <label>
          Fecha de boleta
          <input type="date" name="fecha_boleta" value={form.fecha_boleta} onChange={handleChange} />
        </label>

        <div className="upload-section">
          <button type="button" className="btn-upload" onClick={openUploadWidget}>
            Subir constancia de boleta
          </button>
          {boletaUrl && (
            <div className="boleta-preview">
              <img src={boletaUrl} alt="Constancia de boleta" />
              <span>Constancia subida correctamente</span>
            </div>
          )}
        </div>

        <div className="form-submit-wrapper">
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Registrando...' : 'Registrar Inscripción'}
          </button>
        </div>
      </form>

      <Modal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        onCancel={() => setModal({ open: false, title: '', message: '' })}
      />
    </div>
  )
}
