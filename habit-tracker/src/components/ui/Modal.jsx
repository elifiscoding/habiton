import React, { useEffect } from "react"
import Card from "./Card"

export default function Modal({ open, onClose, children, size = "md" }) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { console.log("User pressed key:", e.key); if (e.key === "Escape") onClose?.() }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: "w-80", md: "w-96", lg: "w-[32rem]" }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <Card size="md" className={`${sizes[size]} p-6 space-y-4`} onClick={(e) => e.stopPropagation()}>
        {children}
      </Card>
    </div>
  )
}
