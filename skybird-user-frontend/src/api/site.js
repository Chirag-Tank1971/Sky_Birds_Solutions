import API from "./axios"

export async function fetchSiteContent() {
  const { data } = await API.get("/site")
  return data
}

export async function fetchTestimonials() {
  const { data } = await API.get("/testimonials")
  return data
}
