import { useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const initialInvitationForm = {
  title: "",
  slug: "",
  image_url_1: "",
  image_url_2: "",
  image_url_3: "",
  event_date: "",
};

const imageSlots = [
  { key: "image_url_1", label: "Gambar 1" },
  { key: "image_url_2", label: "Gambar 2" },
  { key: "image_url_3", label: "Gambar 3" },
];

const initialRsvpForm = {
  invitation_id: "",
  name: "",
  status: "attending",
};

const publicRsvpForm = {
  name: "",
  status: "attending",
};

const statusTone = {
  attending: "is-attending",
  maybe: "is-maybe",
  not_attending: "is-not-attending",
};

function getRoute() {
  const path = window.location.pathname;
  const match = path.match(/^\/invite\/([^/]+)$/);

  if (match) {
    return { mode: "public", slug: decodeURIComponent(match[1]) };
  }

  return { mode: "dashboard", slug: "" };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.error || "Request gagal diproses.");
  }

  return data;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function invitationImages(invitation) {
  if (!invitation) {
    return [];
  }

  return [invitation.image_url_1, invitation.image_url_2, invitation.image_url_3].filter(Boolean);
}

function resolveImageUrl(value) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_BASE}${value}`;
  }

  return value;
}

function App() {
  const route = getRoute();

  if (route.mode === "public") {
    return <PublicInvitationPage slug={route.slug} />;
  }

  return <DashboardPage />;
}

function DashboardPage() {
  const [invitations, setInvitations] = useState([]);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [stats, setStats] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [invitationForm, setInvitationForm] = useState(initialInvitationForm);
  const [rsvpForm, setRsvpForm] = useState(initialRsvpForm);
  const [listQuery, setListQuery] = useState("");
  const [editingInvitationId, setEditingInvitationId] = useState(null);
  const [uploadingImageKey, setUploadingImageKey] = useState("");
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submittingInvitation, setSubmittingInvitation] = useState(false);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const invitationCount = invitations.length;
  const totalGuestResponses = useMemo(
    () => invitations.reduce((sum, invitation) => sum + (invitation.rsvp_count || 0), 0),
    [invitations]
  );
  const filteredInvitations = useMemo(() => {
    const keyword = listQuery.trim().toLowerCase();
    if (!keyword) {
      return invitations;
    }

    return invitations.filter(
      (invitation) =>
        invitation.title.toLowerCase().includes(keyword) ||
        invitation.slug.toLowerCase().includes(keyword)
    );
  }, [invitations, listQuery]);

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    setLoadingInvitations(true);
    setError("");

    try {
      const data = await request("/invitations");
      setInvitations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingInvitations(false);
    }
  }

  async function loadInvitationDetails(slug) {
    if (!slug) {
      return;
    }

    setLoadingDetails(true);
    setError("");
    setNotice("");

    try {
      const invitation = await request(`/invite/${slug}`);
      const [statsResponse, rsvpResponse] = await Promise.all([
        request(`/stats/${invitation.id}`),
        request(`/rsvp/invitation/${invitation.id}`),
      ]);

      setSelectedInvitation(invitation);
      setStats(statsResponse.rsvp_stats);
      setRsvps(rsvpResponse);
      setRsvpForm((current) => ({
        ...current,
        invitation_id: invitation.id,
      }));
    } catch (err) {
      setSelectedInvitation(null);
      setStats(null);
      setRsvps([]);
      setError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleCreateInvitation(event) {
    event.preventDefault();
    setSubmittingInvitation(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...invitationForm,
        event_date: new Date(invitationForm.event_date).toISOString(),
      };

      const created = await request(
        editingInvitationId ? `/invitations/${editingInvitationId}` : "/invitations",
        {
          method: editingInvitationId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setNotice(
        editingInvitationId
          ? `Invitation "${payload.title}" berhasil diperbarui.`
          : `Invitation "${created.title}" berhasil dibuat.`
      );
      setInvitationForm(initialInvitationForm);
      setEditingInvitationId(null);
      await loadInvitations();
      await loadInvitationDetails(payload.slug);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingInvitation(false);
    }
  }

  function handleEditInvitation() {
    if (!selectedInvitation) {
      return;
    }

    setEditingInvitationId(selectedInvitation.id);
    setInvitationForm({
      title: selectedInvitation.title,
      slug: selectedInvitation.slug,
      image_url_1: selectedInvitation.image_url_1 || "",
      image_url_2: selectedInvitation.image_url_2 || "",
      image_url_3: selectedInvitation.image_url_3 || "",
      event_date: new Date(selectedInvitation.event_date).toISOString().slice(0, 16),
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingInvitationId(null);
    setInvitationForm(initialInvitationForm);
  }

  function handleStartCreate() {
    setEditingInvitationId(null);
    setInvitationForm(initialInvitationForm);
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImageUpload(imageKey, file) {
    if (!file) {
      return;
    }

    setUploadingImageKey(imageKey);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_BASE}/uploads/image`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Upload gambar gagal.");
      }

      setInvitationForm((current) => ({
        ...current,
        [imageKey]: data.url,
      }));
      setNotice("Gambar berhasil di-upload.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImageKey("");
    }
  }

  async function handleCreateRsvp(event) {
    event.preventDefault();
    setSubmittingRsvp(true);
    setError("");
    setNotice("");

    try {
      await request("/rsvp", {
        method: "POST",
        body: JSON.stringify({
          invitation_id: Number(rsvpForm.invitation_id),
          name: rsvpForm.name,
          status: rsvpForm.status,
        }),
      });

      setNotice("RSVP berhasil disimpan.");
      setRsvpForm((current) => ({
        ...current,
        name: "",
        status: "attending",
      }));

      if (selectedInvitation?.slug) {
        await Promise.all([loadInvitations(), loadInvitationDetails(selectedInvitation.slug)]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingRsvp(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="orb orb-left" />
      <div className="orb orb-right" />

      <header className="hero">
        <div>
          <p className="eyebrow">React frontend for Go Invitation API</p>
          <h1>Invitation Studio</h1>
          <p className="hero-copy">
            Halaman admin untuk mengelola invitation. Pilih undangan dari daftar,
            tambah undangan baru, atau edit data beserta gambar dalam satu tempat.
          </p>
        </div>

        <div className="hero-stats">
          <article>
            <span>Total Invitation</span>
            <strong>{invitationCount}</strong>
          </article>
          <article>
            <span>Total RSVP</span>
            <strong>{totalGuestResponses}</strong>
          </article>
        </div>
      </header>

      {(notice || error) && (
        <section className={`flash ${error ? "is-error" : "is-success"}`}>
          {error || notice}
        </section>
      )}

      <main className="dashboard-stack">
        <section className="admin-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Invitation Admin</p>
              <h2>List dan form invitation</h2>
            </div>
            <button className="secondary-button" onClick={handleStartCreate}>
              Tambah invitation
            </button>
          </div>

          <div className="admin-grid">
            <section className="panel admin-list-panel">
              <div className="panel-heading row-between">
                <div>
                  <p className="eyebrow">Invitation List</p>
                  <h2>Undangan tersedia</h2>
                </div>

                <button className="secondary-button" onClick={loadInvitations}>
                  Refresh
                </button>
              </div>

              <div className="inline-form">
                <input
                  value={listQuery}
                  onChange={(event) => setListQuery(event.target.value)}
                  placeholder="Cari judul atau slug invitation"
                />
              </div>

              {loadingInvitations ? (
                <p className="muted">Memuat data invitation...</p>
              ) : filteredInvitations.length === 0 ? (
                <p className="muted">Belum ada invitation yang cocok.</p>
              ) : (
                <div className="invitation-list">
                  {filteredInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className={`invitation-card ${
                        selectedInvitation?.id === invitation.id ? "is-active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="card-button"
                        onClick={() => loadInvitationDetails(invitation.slug)}
                      >
                        <span className="invitation-date">{formatDate(invitation.event_date)}</span>
                        <strong>{invitation.title}</strong>
                        <small>/{invitation.slug}</small>
                      </button>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="secondary-button slim-button"
                          onClick={async () => {
                            await loadInvitationDetails(invitation.slug);
                          }}
                        >
                          Detail
                        </button>
                        <a className="visit-link" href={`/invite/${invitation.slug}`}>
                          Halaman tamu
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel admin-form-panel">
              <div className="panel-heading">
                <p className="eyebrow">{editingInvitationId ? "Edit Invitation" : "Insert Invitation"}</p>
                <h2>{editingInvitationId ? "Ubah data invitation" : "Tambah invitation baru"}</h2>
              </div>

              <form onSubmit={handleCreateInvitation} className="form-grid">
                <label>
                  <span>Judul acara</span>
                  <input
                    value={invitationForm.title}
                    onChange={(event) =>
                      setInvitationForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Mis. Wedding Reception"
                    required
                  />
                </label>

                <label>
                  <span>Slug undangan</span>
                  <input
                    value={invitationForm.slug}
                    onChange={(event) =>
                      setInvitationForm((current) => ({
                        ...current,
                        slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
                      }))
                    }
                    placeholder="mis-wedding-reception"
                    required
                  />
                </label>

                <label>
                  <span>Tanggal event</span>
                  <input
                    type="datetime-local"
                    value={invitationForm.event_date}
                    onChange={(event) =>
                      setInvitationForm((current) => ({
                        ...current,
                        event_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                {imageSlots.map((slot) => (
                  <div key={slot.key} className="image-input-card">
                    <label>
                      <span>{slot.label}</span>
                      <input
                        value={invitationForm[slot.key]}
                        onChange={(event) =>
                          setInvitationForm((current) => ({
                            ...current,
                            [slot.key]: event.target.value,
                          }))
                        }
                        placeholder="https://... atau upload file"
                      />
                    </label>

                    <label className="file-picker">
                      <span>Upload file</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleImageUpload(slot.key, event.target.files?.[0])}
                      />
                    </label>

                    {uploadingImageKey === slot.key && (
                      <p className="muted">Meng-upload gambar...</p>
                    )}

                    {invitationForm[slot.key] && (
                      <img
                        className="invitation-image compact-image"
                        src={resolveImageUrl(invitationForm[slot.key])}
                        alt={slot.label}
                      />
                    )}
                  </div>
                ))}

                <button type="submit" disabled={submittingInvitation}>
                  {submittingInvitation
                    ? "Menyimpan..."
                    : editingInvitationId
                      ? "Update Invitation"
                      : "Simpan Invitation"}
                </button>

                {editingInvitationId && (
                  <button type="button" className="secondary-button" onClick={handleCancelEdit}>
                    Batal edit
                  </button>
                )}
              </form>
            </section>
          </div>
        </section>

        <section className="insight-grid">
          <section className="panel panel-detail">
          <div className="panel-heading">
            <p className="eyebrow">Invitation Detail</p>
            <h2>{selectedInvitation ? selectedInvitation.title : "Pilih invitation"}</h2>
          </div>

          {selectedInvitation ? (
            <>
              <div className="detail-grid">
                <article className="metric">
                  <span>Event Date</span>
                  <strong>{formatDate(selectedInvitation.event_date)}</strong>
                </article>
                <article className="metric">
                  <span>Visitor Count</span>
                  <strong>{selectedInvitation.visitor_count}</strong>
                </article>
                <article className="metric">
                  <span>RSVP Count</span>
                  <strong>{selectedInvitation.rsvp_count}</strong>
                </article>
                <article className="metric">
                  <span>Slug</span>
                  <strong>/{selectedInvitation.slug}</strong>
                </article>
              </div>

              <div className="detail-actions">
                <button type="button" onClick={handleEditInvitation}>
                  Edit invitation ini
                </button>
              </div>
            </>
          ) : (
            <p className="muted">
              Pilih invitation dari daftar atau masukkan slug untuk melihat detail.
            </p>
          )}

          {selectedInvitation && invitationImages(selectedInvitation).length > 0 && (
            <div className="image-grid">
              {invitationImages(selectedInvitation).map((image, index) => (
                <img
                  key={`${selectedInvitation.id}-${index}`}
                  className="invitation-image"
                  src={resolveImageUrl(image)}
                  alt={`${selectedInvitation.title} ${index + 1}`}
                />
              ))}
            </div>
          )}
          </section>

          <section className="panel panel-stats">
            <div className="panel-heading">
              <p className="eyebrow">Response Overview</p>
              <h2>Statistik RSVP</h2>
            </div>

            {stats ? (
              <div className="detail-grid compact">
                <article className="metric">
                  <span>Attending</span>
                  <strong>{stats.attending}</strong>
                </article>
                <article className="metric">
                  <span>Maybe</span>
                  <strong>{stats.maybe}</strong>
                </article>
                <article className="metric">
                  <span>Not Attending</span>
                  <strong>{stats.not_attending}</strong>
                </article>
                <article className="metric">
                  <span>Total</span>
                  <strong>{stats.total}</strong>
                </article>
              </div>
            ) : (
              <p className="muted">Statistik akan muncul setelah invitation dipilih.</p>
            )}
          </section>

          <section className="panel panel-rsvp">
          <div className="panel-heading">
            <p className="eyebrow">Guest Form</p>
            <h2>Kirim RSVP</h2>
          </div>

          <form onSubmit={handleCreateRsvp} className="form-grid">
            <label>
              <span>Invitation ID</span>
              <input
                value={rsvpForm.invitation_id}
                onChange={(event) =>
                  setRsvpForm((current) => ({
                    ...current,
                    invitation_id: event.target.value,
                  }))
                }
                placeholder="Pilih invitation atau isi manual"
                required
              />
            </label>

            <label>
              <span>Nama tamu</span>
              <input
                value={rsvpForm.name}
                onChange={(event) =>
                  setRsvpForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Nama tamu"
                required
              />
            </label>

            <label>
              <span>Status RSVP</span>
              <select
                value={rsvpForm.status}
                onChange={(event) =>
                  setRsvpForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="attending">Attending</option>
                <option value="maybe">Maybe</option>
                <option value="not_attending">Not Attending</option>
              </select>
            </label>

            <button type="submit" disabled={submittingRsvp}>
              {submittingRsvp ? "Menyimpan..." : "Kirim RSVP"}
            </button>
          </form>
          </section>

          <section className="panel panel-guests">
          <div className="panel-heading">
            <p className="eyebrow">Guest List</p>
            <h2>Daftar RSVP masuk</h2>
          </div>

          {rsvps.length === 0 ? (
            <p className="muted">Belum ada RSVP untuk invitation ini.</p>
          ) : (
            <div className="guest-list">
              {rsvps.map((rsvp) => (
                <article key={rsvp.id} className="guest-card">
                  <div>
                    <strong>{rsvp.name}</strong>
                    <p>{formatDate(rsvp.created_at)}</p>
                  </div>
                  <span className={`status-pill ${statusTone[rsvp.status] || ""}`}>
                    {rsvp.status.replace("_", " ")}
                  </span>
                </article>
              ))}
            </div>
          )}
          </section>
        </section>
      </main>
    </div>
  );
}

function PublicInvitationPage({ slug }) {
  const [invitation, setInvitation] = useState(null);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(publicRsvpForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [slug]);

  async function loadInvitation() {
    setLoading(true);
    setError("");

    try {
      const detail = await request(`/invite/${slug}`);
      const statsResponse = await request(`/stats/${detail.id}`);
      setInvitation(detail);
      setStats(statsResponse.rsvp_stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!invitation) {
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      await request("/rsvp", {
        method: "POST",
        body: JSON.stringify({
          invitation_id: invitation.id,
          name: form.name,
          status: form.status,
        }),
      });

      setForm(publicRsvpForm);
      setNotice("Terima kasih, RSVP Anda sudah kami terima.");
      await loadInvitation();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="public-shell">
      <div className="public-overlay" />

      <main className="public-page">
        <section className="public-hero">
          <a href="/" className="public-back">
            Kembali ke dashboard
          </a>
          <p className="eyebrow">Digital Invitation</p>
          <h1>{loading ? "Memuat undangan..." : invitation?.title || "Undangan tidak ditemukan"}</h1>
          <p className="public-copy">
            Halaman undangan publik untuk tamu. Silakan konfirmasi kehadiran Anda
            melalui formulir RSVP di bawah.
          </p>
        </section>

        {(notice || error) && (
          <section className={`flash public-flash ${error ? "is-error" : "is-success"}`}>
            {error || notice}
          </section>
        )}

        {loading ? (
          <section className="public-grid">
            <article className="public-card">
              <p className="muted">Sedang mengambil detail undangan...</p>
            </article>
          </section>
        ) : invitation ? (
          <section className="public-grid">
            <article className="public-card public-story">
              <p className="eyebrow">Acara</p>
              <h2>{invitation.title}</h2>
              <div className="public-facts">
                <div>
                  <span>Hari dan waktu</span>
                  <strong>{formatDate(invitation.event_date)}</strong>
                </div>
                <div>
                  <span>Slug undangan</span>
                  <strong>/{invitation.slug}</strong>
                </div>
              </div>

              {invitationImages(invitation).length > 0 && (
                <div className="image-grid public-image-grid">
                  {invitationImages(invitation).map((image, index) => (
                    <img
                      key={`${invitation.id}-${index}`}
                      className="invitation-image"
                      src={resolveImageUrl(image)}
                      alt={`${invitation.title} ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </article>

            <article className="public-card public-rsvp">
              <p className="eyebrow">RSVP</p>
              <h2>Konfirmasi Kehadiran</h2>
              <form className="form-grid" onSubmit={handleSubmit}>
                <label>
                  <span>Nama tamu</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Masukkan nama Anda"
                    required
                  />
                </label>

                <label>
                  <span>Status kehadiran</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="attending">Saya akan hadir</option>
                    <option value="maybe">Masih tentative</option>
                    <option value="not_attending">Maaf, belum bisa hadir</option>
                  </select>
                </label>

                <button type="submit" disabled={submitting}>
                  {submitting ? "Mengirim..." : "Kirim RSVP"}
                </button>
              </form>
            </article>

            <article className="public-card public-stat-card">
              <p className="eyebrow">Statistik</p>
              <h2>Respon Tamu</h2>
              <div className="public-stat-grid">
                <div className="metric">
                  <span>Hadir</span>
                  <strong>{stats?.attending ?? 0}</strong>
                </div>
                <div className="metric">
                  <span>Tentative</span>
                  <strong>{stats?.maybe ?? 0}</strong>
                </div>
                <div className="metric">
                  <span>Tidak hadir</span>
                  <strong>{stats?.not_attending ?? 0}</strong>
                </div>
                <div className="metric">
                  <span>Total RSVP</span>
                  <strong>{stats?.total ?? 0}</strong>
                </div>
              </div>
            </article>
          </section>
        ) : (
          <section className="public-grid">
            <article className="public-card">
              <h2>Undangan tidak ditemukan</h2>
              <p className="muted">
                Slug yang Anda buka belum tersedia atau sudah dihapus.
              </p>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
