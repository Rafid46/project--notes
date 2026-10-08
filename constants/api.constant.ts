export const USERS = {
  createUser: "/api/users/create-user",
  login: "/api/users/login",
  refreshToken: "/api/users/refreshToken",
  getUser: (id: string) => `/api/users/${id}`,
};

export const LABELS = {
  create: "/api/labels/create-label",
  getAll: "/api/labels/get-labels",
  getById: (id: string) => `/api/labels/get-by-id/${id}`,
  update: (id: string) => `/api/labels/update-label/${id}`,
  delete: (id: string) => `/api/labels/delete-label/${id}`,
  setNoteLabel: "/api/labels/set-note-label",
};

export const NOTES = {
  create: "/api/notes/create-note",
  getAll: "/api/notes/get-notes",
  getById: (id: string) => `/api/notes/get-by-id/${id}`,
  update: (id: string) => `/api/notes/update-note/${id}`,
  delete: (id: string) => `/api/notes/delete-note/${id}`,
};
