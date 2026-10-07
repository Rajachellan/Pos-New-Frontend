import axios from 'axios'

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api").trim().replace(/\/+$/, "");
const resolvedBaseUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api=axios.create({
    baseURL: resolvedBaseUrl,
    headers:{
        "Content-Type":"application/json"
    }
})

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("Token") : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof window !== 'undefined') {
        const userDataStr = localStorage.getItem("UserData");
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                if (userData.organizationId && !config.headers['x-organization-id']) {
                    config.headers['x-organization-id'] = userData.organizationId;
                }
            } catch (e) {}
        }

        const selectedBranch = localStorage.getItem("pos_selected_branch");
        if (selectedBranch === 'b1') {
            localStorage.removeItem("pos_selected_branch");
        } else if (selectedBranch && selectedBranch !== 'ALL' && !config.headers['x-branch-id']) {
            config.headers['x-branch-id'] = selectedBranch;
        }
    }

    return config;
});

export default api