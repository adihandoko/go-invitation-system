import { useEffect, useMemo, useState } from "react";
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CWidgetStatsA,
} from "@coreui/react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const imageSlots = [
  { key: "image_url_1", label: "Gambar 1" },
  { key: "image_url_2", label: "Gambar 2" },
  { key: "image_url_3", label: "Gambar 3" },
];

const initialInvitationForm = {
  title: "",
  slug: "",
  image_url_1: "",
  image_url_2: "",
  image_url_3: "",
  event_date: "",
};

const initialRsvpForm = {
  invitation_id: "",
  name: "",
  status: "attending",
};

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
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

function invitationImages(invitation) {
  if (!invitation) {
    return [];
  }

  return [invitation.image_url_1, invitation.image_url_2, invitation.image_url_3].filter(Boolean);
}

function InvitationManagerPage() {
  const [invitations, setInvitations] = useState([]);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [stats, setStats] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [invitationForm, setInvitationForm] = useState(initialInvitationForm);
  const [rsvpForm, setRsvpForm] = useState(initialRsvpForm);
  const [editingInvitationId, setEditingInvitationId] = useState(null);
  const [uploadingImageKey, setUploadingImageKey] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submittingInvitation, setSubmittingInvitation] = useState(false);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

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

  const invitationCount = invitations.length;
  const totalRsvpCount = invitations.reduce(
    (sum, invitation) => sum + (invitation.rsvp_count || 0),
    0
  );

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

  async function handleInvitationSubmit(event) {
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

  async function handleDeleteInvitation(invitation) {
    const confirmed = window.confirm(`Hapus invitation "${invitation.title}"?`);
    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await request(`/invitations/${invitation.id}`, { method: "DELETE" });
      setNotice(`Invitation "${invitation.title}" berhasil dihapus.`);
      if (selectedInvitation?.id === invitation.id) {
        setSelectedInvitation(null);
        setStats(null);
        setRsvps([]);
      }
      if (editingInvitationId === invitation.id) {
        setEditingInvitationId(null);
        setInvitationForm(initialInvitationForm);
      }
      await loadInvitations();
    } catch (err) {
      setError(err.message);
    }
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

  async function handleRsvpSubmit(event) {
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

  function handleStartCreate() {
    setEditingInvitationId(null);
    setInvitationForm(initialInvitationForm);
    setNotice("");
    setError("");
  }

  function handleEditInvitation(invitation) {
    setEditingInvitationId(invitation.id);
    setInvitationForm({
      title: invitation.title,
      slug: invitation.slug,
      image_url_1: invitation.image_url_1 || "",
      image_url_2: invitation.image_url_2 || "",
      image_url_3: invitation.image_url_3 || "",
      event_date: new Date(invitation.event_date).toISOString().slice(0, 16),
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <CRow className="mb-4 g-4">
        <CCol md={6} xl={3}>
          <CWidgetStatsA color="primary" value={<>{invitationCount}</>} title="Total Invitation" />
        </CCol>
        <CCol md={6} xl={3}>
          <CWidgetStatsA color="success" value={<>{totalRsvpCount}</>} title="Total RSVP" />
        </CCol>
      </CRow>

      {(notice || error) && (
        <CAlert color={error ? "danger" : "success"} className="mb-4">
          {error || notice}
        </CAlert>
      )}

      <CRow className="g-4">
        <CCol xl={5}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Invitation List</strong>
                <div className="small text-body-secondary">Pilih invitation untuk lihat detail</div>
              </div>
              <CButtonGroup>
                <CButton color="light" onClick={loadInvitations}>
                  Refresh
                </CButton>
                <CButton color="primary" onClick={handleStartCreate}>
                  Tambah
                </CButton>
              </CButtonGroup>
            </CCardHeader>
            <CCardBody>
              <CFormInput
                className="mb-3"
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder="Cari judul atau slug"
              />

              {loadingInvitations ? (
                <div className="text-center py-4">
                  <CSpinner />
                </div>
              ) : filteredInvitations.length === 0 ? (
                <p className="text-body-secondary mb-0">Belum ada invitation yang cocok.</p>
              ) : (
                <div className="invitation-list-coreui">
                  {filteredInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className={`invitation-list-item ${
                        selectedInvitation?.id === invitation.id ? "is-active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="invitation-select-button"
                        onClick={() => loadInvitationDetails(invitation.slug)}
                      >
                        <span className="small text-body-secondary">
                          {formatDate(invitation.event_date)}
                        </span>
                        <strong>{invitation.title}</strong>
                        <span className="small text-body-secondary">/{invitation.slug}</span>
                      </button>
                      <div className="invitation-list-actions">
                        <CButton
                          color="light"
                          size="sm"
                          onClick={() => handleEditInvitation(invitation)}
                        >
                          Edit
                        </CButton>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvitation(invitation)}
                        >
                          Hapus
                        </CButton>
                        <a
                          href={`${PUBLIC_SITE_URL}/invite/${invitation.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-primary"
                        >
                          Lihat
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xl={7}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>{editingInvitationId ? "Edit Invitation" : "Insert Invitation"}</strong>
              <div className="small text-body-secondary">
                Form admin untuk tambah atau ubah undangan
              </div>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleInvitationSubmit}>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel>Judul acara</CFormLabel>
                    <CFormInput
                      value={invitationForm.title}
                      onChange={(event) =>
                        setInvitationForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      required
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Slug invitation</CFormLabel>
                    <CFormInput
                      value={invitationForm.slug}
                      onChange={(event) =>
                        setInvitationForm((current) => ({
                          ...current,
                          slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
                        }))
                      }
                      required
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Tanggal event</CFormLabel>
                    <CFormInput
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
                  </CCol>
                </CRow>

                <div className="mt-4">
                  <div className="fw-semibold mb-3">Galeri Invitation</div>
                  <CRow className="g-3">
                    {imageSlots.map((slot) => (
                      <CCol md={4} key={slot.key}>
                        <div className="image-upload-card">
                          <CFormLabel>{slot.label}</CFormLabel>
                          <CFormInput
                            className="mb-2"
                            value={invitationForm[slot.key]}
                            onChange={(event) =>
                              setInvitationForm((current) => ({
                                ...current,
                                [slot.key]: event.target.value,
                              }))
                            }
                            placeholder="https://... atau upload file"
                          />
                          <CFormInput
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              handleImageUpload(slot.key, event.target.files?.[0])
                            }
                          />
                          {uploadingImageKey === slot.key && (
                            <div className="small text-body-secondary mt-2">Meng-upload...</div>
                          )}
                          {invitationForm[slot.key] && (
                            <img
                              className="upload-preview mt-3"
                              src={resolveImageUrl(invitationForm[slot.key])}
                              alt={slot.label}
                            />
                          )}
                        </div>
                      </CCol>
                    ))}
                  </CRow>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <CButton type="submit" color="primary" disabled={submittingInvitation}>
                    {submittingInvitation
                      ? "Menyimpan..."
                      : editingInvitationId
                        ? "Update Invitation"
                        : "Simpan Invitation"}
                  </CButton>
                  {editingInvitationId && (
                    <CButton type="button" color="light" onClick={handleStartCreate}>
                      Batal Edit
                    </CButton>
                  )}
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-4">
        <CCol xl={8}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{selectedInvitation ? selectedInvitation.title : "Invitation Detail"}</strong>
                <div className="small text-body-secondary">
                  {selectedInvitation ? `/${selectedInvitation.slug}` : "Pilih invitation dulu"}
                </div>
              </div>
              {selectedInvitation && (
                <CButton color="primary" onClick={() => handleEditInvitation(selectedInvitation)}>
                  Edit data
                </CButton>
              )}
            </CCardHeader>
            <CCardBody>
              {loadingDetails ? (
                <div className="text-center py-4">
                  <CSpinner />
                </div>
              ) : selectedInvitation ? (
                <>
                  <CRow className="g-3 mb-4">
                    <CCol md={3}>
                      <div className="detail-chip">
                        <span>Event Date</span>
                        <strong>{formatDate(selectedInvitation.event_date)}</strong>
                      </div>
                    </CCol>
                    <CCol md={3}>
                      <div className="detail-chip">
                        <span>Visitor</span>
                        <strong>{selectedInvitation.visitor_count}</strong>
                      </div>
                    </CCol>
                    <CCol md={3}>
                      <div className="detail-chip">
                        <span>RSVP</span>
                        <strong>{selectedInvitation.rsvp_count}</strong>
                      </div>
                    </CCol>
                    <CCol md={3}>
                      <div className="detail-chip">
                        <span>Status</span>
                        <strong>Active</strong>
                      </div>
                    </CCol>
                  </CRow>

                  {invitationImages(selectedInvitation).length > 0 && (
                    <div className="image-grid-coreui">
                      {invitationImages(selectedInvitation).map((image, index) => (
                        <img
                          key={`${selectedInvitation.id}-${index}`}
                          className="gallery-image"
                          src={resolveImageUrl(image)}
                          alt={`${selectedInvitation.title} ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-body-secondary">Pilih invitation dari list untuk melihat detail.</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xl={4}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>RSVP Stats</strong>
              <div className="small text-body-secondary">Ringkasan respon tamu</div>
            </CCardHeader>
            <CCardBody>
              {stats ? (
                <div className="stats-stack">
                  <div className="detail-chip">
                    <span>Attending</span>
                    <strong>{stats.attending}</strong>
                  </div>
                  <div className="detail-chip">
                    <span>Maybe</span>
                    <strong>{stats.maybe}</strong>
                  </div>
                  <div className="detail-chip">
                    <span>Not Attending</span>
                    <strong>{stats.not_attending}</strong>
                  </div>
                  <div className="detail-chip">
                    <span>Total</span>
                    <strong>{stats.total}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-body-secondary">Statistik muncul setelah invitation dipilih.</div>
              )}
            </CCardBody>
          </CCard>

          <CCard className="mb-4">
            <CCardHeader>
              <strong>Input RSVP</strong>
              <div className="small text-body-secondary">Masukkan RSVP manual dari admin</div>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleRsvpSubmit}>
                <div className="mb-3">
                  <CFormLabel>Invitation ID</CFormLabel>
                  <CFormInput
                    value={rsvpForm.invitation_id}
                    onChange={(event) =>
                      setRsvpForm((current) => ({
                        ...current,
                        invitation_id: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel>Nama tamu</CFormLabel>
                  <CFormInput
                    value={rsvpForm.name}
                    onChange={(event) =>
                      setRsvpForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel>Status RSVP</CFormLabel>
                  <CFormSelect
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
                  </CFormSelect>
                </div>
                <CButton type="submit" color="success" disabled={submittingRsvp}>
                  {submittingRsvp ? "Menyimpan..." : "Kirim RSVP"}
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Guest List</strong>
          <div className="small text-body-secondary">Daftar RSVP untuk invitation terpilih</div>
        </CCardHeader>
        <CCardBody>
          {rsvps.length === 0 ? (
            <div className="text-body-secondary">Belum ada RSVP untuk invitation ini.</div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Nama</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Dibuat</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rsvps.map((rsvp) => (
                  <CTableRow key={rsvp.id}>
                    <CTableDataCell>{rsvp.name}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge
                        color={
                          rsvp.status === "attending"
                            ? "success"
                            : rsvp.status === "maybe"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {rsvp.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{formatDate(rsvp.created_at)}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  );
}

export default InvitationManagerPage;
