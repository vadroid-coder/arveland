"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 400 * 1024; // keep the data URL small enough for the DB

export default function LogoUpload({ initial }: { initial?: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Выберите файл изображения (PNG, JPG, SVG)");
      return;
    }
    const dataUrl = await downscale(file);
    if (dataUrl.length > MAX_BYTES * 1.4) {
      setError("Файл слишком большой — используйте логотип поменьше");
      return;
    }
    setValue(dataUrl);
  }

  return (
    <div>
      <label className="label">Логотип</label>
      <input type="hidden" name="logo" value={value} />
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-ink-300 bg-ink-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Logo"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-ink-400">Нет логотипа</span>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => inputRef.current?.click()}
            >
              Загрузить
            </button>
            {value && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setValue("")}
              >
                Удалить
              </button>
            )}
          </div>
          <p className="text-xs text-ink-400">
            Показывается в левом верхнем углу счёта. PNG/JPG/SVG, до ~400 КБ.
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/** Reads the file and, for raster images, downscales it to max 600px wide. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = String(reader.result);
      if (file.type === "image/svg+xml") return resolve(dataUrl);

      const img = new Image();
      img.onload = () => {
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
