const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function handleResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const data = await res.json();
      throw new Error(data.message || `Request failed (${res.status})`);
    }
    throw new Error(`Request failed (${res.status})`);
  }
  if (contentType.includes('application/json')) return res.json();
  return res;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  me: async (token: string) => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },

  changePassword: async (token: string, oldPassword: string, newPassword: string) => {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    return handleResponse(res);
  },
};

export const userAPI = {
  getTheme: async (token: string) => {
    const res = await fetch(`${API_URL}/user/theme`, { headers: authHeaders(token) });
    return handleResponse(res);
  },

  setTheme: async (token: string, theme: 'light' | 'dark' | 'auto') => {
    const res = await fetch(`${API_URL}/user/theme`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ theme }),
    });
    return handleResponse(res);
  },

  saveTheme: async (theme: string, token: string) => {
    const res = await fetch(`${API_URL}/user/theme`, {
      method: 'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    return handleResponse(res);
  },
};

export const reportsAPI = {
  /**
   * Upload files for report generation
   */
  upload: async (
    files: File[],
    token: string,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(Math.round(progress));
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Upload failed (${xhr.status})`));
          }
        } catch (err) {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${API_URL}/reports/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  /**
   * Get all reports for logged-in user
   */
  listReports: async (token: string) => {
    const res = await fetch(`${API_URL}/reports`, {
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },

  /**
   * Get a specific report by ID
   */
  getReport: async (reportId: string, token: string) => {
    const res = await fetch(`${API_URL}/reports/${reportId}`, {
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },

  /**
   * Generate/regenerate a report
   */
  generateReport: async (reportId: string, token: string) => {
    const res = await fetch(`${API_URL}/reports/${reportId}/generate`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },

  /**
   * Download PDF report
   */
  downloadReport: async (reportId: string, token: string) => {
    const res = await fetch(`${API_URL}/reports/${reportId}/download`, {
      headers: authHeaders(token),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Download failed');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  },

  /**
   * Delete a report
   */
  deleteReport: async (reportId: string, token: string) => {
    const res = await fetch(`${API_URL}/reports/${reportId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },
};

export const dashboardAPI = {
  /**
   * Get dashboard statistics
   */
  getStats: async (token: string) => {
    const res = await fetch(`${API_URL}/dashboard/stats`, {
      headers: authHeaders(token),
    });
    return handleResponse(res);
  },
};

export interface Report {
  _id: string;
  reportId: string;
  id?: string;
  name: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted?: string;
  status: 'Pending' | 'Completed' | 'Failed';
  fileType?: string;
  downloadCount: number;
  createdAt: string;
  generatedDate?: string;
  analytics?: Record<string, unknown>;
  errorMessage?: string;
}


