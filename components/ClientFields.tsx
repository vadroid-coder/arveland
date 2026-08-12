"use client";

import { useT } from "./I18nProvider";

type ClientLike = {
  name?: string;
  regNumber?: string;
  vatNumber?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
};

export default function ClientFields({ client }: { client?: ClientLike }) {
  const t = useT();
  const c = client ?? {};
  return (
    <div className="@container grid gap-4 @md:grid-cols-2">
      <div>
        <label className="label">{t.common.companyName} *</label>
        <input name="name" className="field" defaultValue={c.name ?? ""} required />
      </div>
      <div>
        <label className="label">{t.common.regNumber} *</label>
        <input
          name="regNumber"
          className="field"
          defaultValue={c.regNumber ?? ""}
          required
        />
      </div>
      <div>
        <label className="label">{t.common.vatNumber}</label>
        <input
          name="vatNumber"
          className="field"
          defaultValue={c.vatNumber ?? ""}
        />
      </div>
      <div>
        <label className="label">{t.common.email}</label>
        <input
          name="email"
          type="email"
          className="field"
          defaultValue={c.email ?? ""}
        />
      </div>
      <div>
        <label className="label">{t.common.phone}</label>
        <input name="phone" className="field" defaultValue={c.phone ?? ""} />
      </div>
      <div className="@md:col-span-2">
        <label className="label">{t.common.address}</label>
        <textarea
          name="address"
          rows={2}
          className="field"
          defaultValue={c.address ?? ""}
        />
      </div>
    </div>
  );
}
