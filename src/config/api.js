/* Backend API seam. apiBaseUrl is null by default, which keeps the
   storefront on its current localStorage behavior. Set it to use the
   backend: an empty string means same origin, which is right when the
   frontend and the API share one Vercel project, and a full URL means
   a separately hosted backend. See api/README.md. Nothing in the
   storefront reads this value yet, so changing it alone changes
   nothing until the apiClient is wired in. */

export const apiBaseUrl = null
