import { useState, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'

const ProfileModal = forwardRef(function ProfileModal(props, ref) {
  const [data, setData] = useState(null)

  useImperativeHandle(ref, () => ({
    show(d) { setData(d) },
    hide() { setData(null) }
  }))

  if (!data) return null

  return createPortal(
    <div className="modal-backdrop" onClick={() => setData(null)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setData(null)}>&times;</button>
        <h4>{data.Candidate_Name}</h4>
        <p>{data.Profile_Summary}</p>
      </div>
    </div>,
    document.body
  )
})

export default ProfileModal
