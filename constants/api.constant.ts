export const USERS = {
  createUser: "/api/users/create-user",
  login: "/api/users/login",
  getUser: (id: string) => `/api/users/${id}`,
};

export const LABELS = {
  create: "/api/labels/create-label",
  getAll: (userId: string) => `/api/labels/get-labels/${userId}`,
  getById: (id: string) => `/api/labels/get-by-id/${id}`,
  update: (id: string) => `/api/labels/update-label/${id}`,
  delete: (id: string) => `/api/labels/delete-label/${id}`,
  setNoteLabel: "/api/labels/set-note-label",
};
