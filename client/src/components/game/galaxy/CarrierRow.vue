<template>
<tr>
    <td><i class="fas fa-circle" v-if="carrier.ownedByPlayerId" :style="{ 'color': getColour() }"></i></td>
    <td><a href="javascript:;" @click="clickCarrier">{{carrier.name}}</a></td>
    <td><a href="javascript:;" @click="goToCarrier"><i class="far fa-eye"></i></a></td>
    <td><specialist-icon :type="'carrier'" :defaultIcon="'rocket'" :specialist="carrier.specialist" :hideDefaultIcon="true"></specialist-icon></td>
    <td class="text-right">{{carrier.ships == null ? '???' : carrier.ships}}</td>
    <td class="text-right">{{carrier.waypoints.length}}</td>
    <td><i class="fas fa-sync" v-if="carrier.waypointsLooped"></i></td>
    <td><span v-if="carrier.waypoints.length">{{timeRemainingEta}}</span></td>
    <!-- <td><span v-if="carrier.waypoints.length">{{timeRemainingEtaTotal}}</span></td> -->
</tr>
</template>

<script>
import gameContainer from '../../../game/container'
import GameHelper from '../../../services/gameHelper'
import SpecialistIcon from '../specialist/SpecialistIcon'

export default {
  components: {
    'specialist-icon': SpecialistIcon
  },
  props: {
    carrier: Object
  },
  data () {
    return {
      timeRemainingEta: null,
      timeRemainingEtaTotal: null,
      intervalFunction: null
    }
  },
  mounted () {
    this.recalculateTimeRemaining()

    if (GameHelper.isGameInProgress(this.$store.state.game) || GameHelper.isGamePendingStart(this.$store.state.game)) {
      this.intervalFunction = setInterval(this.recalculateTimeRemaining, 100)
    }
  },
  methods: {
    getColour () {
      return GameHelper.getPlayerColour(this.$store.state.game, this.carrier.ownedByPlayerId)
    },
    clickCarrier (e) {
      this.$emit('onOpenCarrierDetailRequested', this.carrier._id)
    },
    goToCarrier (e) {
      gameContainer.map.panToLocation(this.carrier.location)
    },
    recalculateTimeRemaining () {
      this.timeRemainingEta = GameHelper.getCountdownTimeStringByTicks(this.$store.state.game, this.carrier.ticksEta)

      // TODO: Get total time of carrier eta
      // this.timeRemainingEtaTotal = GameHelper.getCountdownTimeString(this.$store.state.game, this.carrier.ticksEtaTotal)
    }
  }
}
</script>

<style scoped>
td {
  padding: 12px 6px !important;
}
</style>
