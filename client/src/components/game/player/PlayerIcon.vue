<template>
  <span v-if="player" class="span-container" :title="onlineStatus">
    <player-icon-shape :filled="iconFilled" :iconColour="iconColour" :shape="player.shape" />
  </span>
</template>
<script>
import GameHelper from '../../../services/gameHelper'
import moment from 'moment'
import PlayerIconShape from './PlayerIconShape.vue'

export default {
  components: { PlayerIconShape },
  props: {
    playerId: String,
    hideOnlineStatus: Boolean,
    solidGlyphOnly: Boolean,
    colour: String
  },
  data () {
    return {
      player: null,
      onlineStatus: '',
      isOnline: false,
      iconColour: '',
      intervalFunction: null
    }
  },
  mounted () {
    this.player = GameHelper.getPlayerById(this.$store.state.game, this.playerId)

    this.iconColour = !this.colour ? GameHelper.getFriendlyColour(this.player.colour.value) : this.colour

    let isHiddenPlayerOnlineStatus = GameHelper.isHiddenPlayerOnlineStatus(this.$store.state.game)

    if (!this.hideOnlineStatus && !isHiddenPlayerOnlineStatus) {
      this.intervalFunction = setInterval(this.recalculateOnlineStatus, 1000)
    }
  },
  destroyed () {
    clearInterval(this.intervalFunction)
  },
  methods: {
    recalculateOnlineStatus () {
      if (this.player.isOnline == null) {
        this.onlineStatus = ''
        this.isOnline = false;
      }
      else if (this.player.isOnline) {
        this.onlineStatus = 'Online Now'
        this.isOnline = true;
      }
      else {
        this.onlineStatus = moment(this.player.lastSeen).utc().fromNow()
        this.isOnline = false;
      }
    }
  },
  computed: {
    iconFilled () {
      const unknownStatus = this.player.isOnline == null;
      return unknownStatus || this.isOnline || this.solidGlyphOnly;
    }
  }
}
</script>

<style scoped>
.span-container {
  display: inline-block;
  height: 18px;
  width: 18px;
  margin-top: -12px;
  margin-right: -6px;
}

@media screen and (max-width: 576px) { 
  .span-container {
    height: 10px;
    width: 10px;
    margin-top: -12px;
    margin-right: -6px;
  }
}
</style>
