import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from './cropImage'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'

interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropCompleteAction: (croppedImageBlobUrl: string) => void;
  aspect?: number;
  cropShape?: 'rect' | 'round';
}

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropCompleteAction,
  aspect = 4 / 3,
  cropShape = 'rect'
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    try {
      setIsProcessing(true)
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0
      )
      onCropCompleteAction(croppedImage)
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Adjust Image</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[400px] bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
            />
          )}
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value))
              }}
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter className="p-4 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing || !imageSrc} className="bg-[#172263] text-white hover:bg-[#11194A]">
            {isProcessing ? "Processing..." : "Apply & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
