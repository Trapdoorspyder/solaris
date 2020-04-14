import axios from 'axios'
import BaseApiService from './base'

class UserService extends BaseApiService {
  
  getMyUserInfo () {
    return axios.get(this.BASE_URL + 'user', { withCredentials: true })
  }

  createUser (username, email, password) {
    return axios.post(this.BASE_URL + 'user', {
      username: username,
      email: email,
      password: password
    })
  }

  toggleEmailNotifications (enabled) {
    return axios.put(this.BASE_URL + 'user/changeEmailPreference', {
      enabled
    },
    { withCredentials: true })
  }

  updateEmailAddress (email) {
    return axios.put(this.BASE_URL + 'user/changeEmailAddress', {
      email
    },
    { withCredentials: true })
  }

  updatePassword (currentPassword, newPassword) {
    return axios.put(this.BASE_URL + 'user/changePassword', {
      currentPassword, newPassword
    },
    { withCredentials: true })
  }

}

export default new UserService()
