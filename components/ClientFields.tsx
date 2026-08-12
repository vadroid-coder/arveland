type ClientLike = {
  name?: string;
  regNumber?: string;
  vatNumber?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
};

export default function ClientFields({ client }: { client?: ClientLike }) {
  const c = client ?? {};
  return (
    <div className="@container grid gap-4 @md:grid-cols-2">
      <div>
        <label className="label">Название компании *</label>
        <input name="name" className="field" defaultValue={c.name ?? ""} required />
      </div>
      <div>
        <label className="label">Регистрационный код *</label>
        <input
          name="regNumber"
          className="field"
          defaultValue={c.regNumber ?? ""}
          required
        />
      </div>
      <div>
        <label className="label">Номер НДС (KMKR / VAT)</label>
        <input
          name="vatNumber"
          className="field"
          defaultValue={c.vatNumber ?? ""}
        />
      </div>
      <div>
        <label className="label">E-mail</label>
        <input
          name="email"
          type="email"
          className="field"
          defaultValue={c.email ?? ""}
        />
      </div>
      <div>
        <label className="label">Телефон</label>
        <input name="phone" className="field" defaultValue={c.phone ?? ""} />
      </div>
      <div className="@md:col-span-2">
        <label className="label">Адрес</label>
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
