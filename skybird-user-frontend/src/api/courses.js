import API from "./axios"

export async function fetchCourses(params = {}) {
  const { data } = await API.get("/courses", { params })
  return data
}

export async function fetchCourseById(id) {
  const { data } = await API.get(`/courses/${id}`)
  return data
}

export async function fetchPlatforms() {
  const { data } = await API.get("/platforms")
  return data
}
