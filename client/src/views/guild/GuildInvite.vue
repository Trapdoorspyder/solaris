<template>
  <tr>
    <td>{{invite.name}}[{{invite.tag}}]</td>
    <td class="text-right">
      <button class="btn btn-sm btn-success ml-1" :disabled="isLoading" @click="accept()" title="Accept Invitation">
        <i class="fas fa-check"></i>
      </button>
      <button class="btn btn-sm btn-danger ml-1" :disabled="isLoading" @click="reject()" title="Reject Invitation">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  </tr>
</template>

<script>
import GuildApiService from '../../services/api/guild'

export default {
  props: {
    invite: Object
  },
  data () {
    return {
      isLoading: false
    }
  },
  methods: {
    async accept () {
      if (!confirm(`Are you sure you want to accept the invitation from ${this.invite.name}[${this.invite.tag}]?`)) {
        return
      }

      this.isLoading = true

      try {
        let response = await GuildApiService.acceptInvite(this.invite._id)

        if (response.status === 200) {
          this.$emit('onInvitationAccepted', this.invite._id)
        }
      } catch (err) {
        console.error(err)
      }

      this.isLoading = false
    },
    async reject () {
      if (!confirm(`Are you sure you want to decline the invitation from ${this.invite.name}[${this.invite.tag}]?`)) {
        return
      }

      this.isLoading = true

      try {
        let response = await GuildApiService.declineInvite(this.invite._id)

        if (response.status === 200) {
          this.$emit('onInvitationDeclined', this.invite._id)
        }
      } catch (err) {
        console.error(err)
      }

      this.isLoading = false
    }
  },
  computed: {

  }
}
</script>

<style scoped>

</style>
