<template>
<div class="menu-page">
  <loading-spinner :loading="!conversation"/>

  <div class="container" v-if="conversation">
    <menu-title :title="conversation.name" @onCloseRequested="onCloseRequested">
      <button class="btn btn-sm btn-primary" @click="onOpenInboxRequested" title="Back to Inbox"><i class="fas fa-inbox"></i></button>
      <button class="btn btn-sm btn-warning ml-1" @click="leaveConversation" v-if="conversation.createdBy" title="Leave"><i class="fas fa-sign-out-alt"></i></button>
    </menu-title>

    <conversation-participants :conversation="conversation"/>

    <div class="pt-0 mb-2 mt-2 messages-container" v-if="conversation.messages.length">
      <div v-for="message in conversation.messages" v-bind:key="message._id" class="mb-1">
        <conversation-message v-if="message.type === 'message'" :message="message" @onOpenPlayerDetailRequested="onOpenPlayerDetailRequested"/>
        <conversation-trade-event v-if="message.type !== 'message'" :event="message"/>
      </div>
    </div>

    <div class="pt-0 mb-2 mt-2" v-if="!conversation.messages.length">
        <p class="mb-0 text-center">No messages.</p>
    </div>

    <compose-conversation-message :conversationId="conversationId" :conversationMessage="currentConversationMessage" @onConversationMessageSent="onConversationMessageSent" @onMessageChange="onMessageChange"/>
  </div>
</div>
</template>

<script>
import GameHelper from '../../../../services/gameHelper'
import ConversationApiService from '../../../../services/api/conversation'
import LoadingSpinnerVue from '../../../../components/LoadingSpinner'
import MenuTitle from '../../MenuTitle'
import ConversationParticipantsVue from './ConversationParticipants'
import ComposeMessageVue from './ConversationCompose'
import ConversationMessageVue from './ConversationMessage'
import ConversationTradeEventVue from './ConversationTradeEvent.vue'

export default {
  components: {
    'menu-title': MenuTitle,
    'loading-spinner': LoadingSpinnerVue,
    'conversation-participants': ConversationParticipantsVue,
    'compose-conversation-message': ComposeMessageVue,
    'conversation-message': ConversationMessageVue,
    'conversation-trade-event': ConversationTradeEventVue
  },
  props: {
    conversationId: String,
  },
  data () {
    return {
      conversation: null,
      userPlayer: null,
      currentConversationMessage: null
    }
  },
  created () {
    this.sockets.subscribe('gameMessageSent', this.onMessageReceived)
    this.sockets.subscribe('gameConversationRead', this.onConversationRead)
    this.sockets.subscribe('gameConversationLeft', this.onConversationLeft)
    this.sockets.subscribe('playerCreditsReceived', this.onTradeEventReceived)
    this.sockets.subscribe('playerRenownReceived', this.onTradeEventReceived)
    this.sockets.subscribe('playerTechnologyReceived', this.onTradeEventReceived)
  },
  destroyed () {
    this.sockets.unsubscribe('gameMessageSent')
    this.sockets.unsubscribe('gameConversationRead')
    this.sockets.unsubscribe('gameConversationLeft')
    this.sockets.unsubscribe('playerCreditsReceived')
    this.sockets.unsubscribe('playerRenownReceived')
    this.sockets.unsubscribe('playerTechnologyReceived')
  },
  async mounted () {
    this.userPlayer = GameHelper.getUserPlayer(this.$store.state.game)._id
    this.currentConversationMessage = this.$store.getters.getConversationMessage(this.conversationId)

    await this.loadConversation()
  },
  methods: {
    cacheComposedMessage () {
      this.$store.commit('storeConversationMessage', {
        conversationId: this.conversationId,
        message: this.currentConversationMessage
      })
    },
    onMessageChange (e) {
      this.currentConversationMessage = e;
    },
    onCloseRequested (e) {
      this.cacheComposedMessage()
      this.$emit('onCloseRequested', e)
    },
    onOpenInboxRequested (e) {
      this.cacheComposedMessage()
      this.$emit('onOpenInboxRequested', e)
    },
    onOpenPlayerDetailRequested (e) {
      this.cacheComposedMessage()
      this.$emit('onOpenPlayerDetailRequested', e)
    },
    onConversationMessageSent (e) {
      this.conversation.messages.push(e)

      this.scrollToEnd()
    },
    onMessageReceived (e) {
      if (e.conversationId === this.conversation._id) {
        this.conversation.messages.push(e)

        this.scrollToEnd()
      }
    },
    onConversationRead (e) {
      if (e.conversationId === this.conversation._id) {
        let messages = this.conversation.messages.filter(m => m.type === 'message')

        for (let message of messages) {
          if (message.readBy.indexOf(e.readByPlayerId) < 0) {
            message.readBy.push(e.readByPlayerId)
          }
        }
      }
    },
    onConversationLeft (e) {
      if (e.conversationId === this.conversation._id) {
        this.conversation.participants.splice(this.conversation.participants.indexOf(e.playerId), 1)
      }
    },
    onTradeEventReceived (e) {
      if (this.conversation.participants.length !== 2) {
        return
      }

      let partnerPlayerId = this.conversation.participants.filter(p => p !== this.userPlayer._id)[0]

      let isTradeEventBetweenPlayers = (t.playerId === this.userPlayer._id && t.data.fromPlayerId === this.partnerPlayerId) ||
        (t.playerId === this.partnerPlayerId && t.data.fromPlayerId === this.userPlayer._id) ||
        (t.playerId === this.userPlayer._id && t.data.toPlayerId === this.partnerPlayerId) ||
        (t.playerId === this.partnerPlayerId && t.data.toPlayerId === this.userPlayer._id)

      if (isTradeEventBetweenPlayers) {
        this.conversation.messages.push(e)

        this.scrollToEnd()
      }
    },
    scrollToEnd () {
      // This doesn't seem to work inline, have to wait 100ms so that the UI can update itself
      // before scrolling the div container to the bottom.
      setTimeout(async () => {
        if (this.conversation && this.conversation.messages.length) {
          const messagesContainer = this.$el.querySelector('.messages-container')
          messagesContainer.scrollTop = messagesContainer.scrollHeight

          await this.markConversationAsRead()
        }
      }, 100)
    },
    async loadConversation () {
      this.conversation = null

      try {
        let response = await ConversationApiService.detail(this.$store.state.game._id, this.conversationId)

        if (response.status === 200) {
          this.conversation = response.data
        
          this.scrollToEnd()
        }
      } catch (e) {
        console.error(e)
      }
    },
    async markConversationAsRead () {
      try {
        await ConversationApiService.markAsRead(this.$store.state.game._id, this.conversation._id)
      } catch (err) {
        console.error(err)
      }
    },
    async leaveConversation () {
      if (confirm(`Are you sure you want to leave this conversation?`)) {
        try {
          this.onOpenInboxRequested()

          await ConversationApiService.leave(this.$store.state.game._id, this.conversation._id)
        } catch (err) {
          console.error(err)
        }
      }
    }
  },
  computed: {
    
  }
}
</script>

<style scoped>
.messages-container {
  max-height: 400px;
  overflow: auto;
}
</style>
