<template>
<div class="container-fluid bg-dark pt-2 pb-2 footer-bar">
    <div class="row no-gutters">
        <div class="col" v-if="!userPlayer && gameIsJoinable">
          <button class="btn" v-on:click="setMenuState(MENU_STATES.WELCOME)">
            <i class="fas fa-handshake"></i>
          </button>
        </div>
        <!-- <div class="col" v-if="!userPlayer">
          <router-link to="/codex" class="btn"><i class="fas fa-question"></i></router-link>
        </div> -->
        <div class="col" v-if="userPlayer">
          <button class="btn" v-on:click="setMenuState(MENU_STATES.LEADERBOARD)">
            <i class="fas fa-users"></i>
          </button>
        </div>
        <div class="col" v-if="userPlayer">
          <button class="btn" v-on:click="setMenuState(MENU_STATES.RESEARCH)">
            <i class="fas fa-flask"></i>
          </button>
        </div>
        <div class="col" v-if="userPlayer">
          <button class="btn" @click="panToHomeStar()">
            <i class="fas fa-home"></i>
          </button>
        </div>
        <div class="col" v-if="userPlayer">
          <button class="btn" v-on:click="setMenuState(MENU_STATES.GALAXY)">
            <i class="fas fa-sun"></i>
          </button>
        </div>
        <div class="col">
          <hamburger-menu :dropType="'dropup'"
            @onMenuStateChanged="onMenuStateChanged" />
        </div>
    </div>
</div>
</template>

<script>
import GameHelper from '../../../services/gameHelper'
import MENU_STATES from '../../data/menuStates'
import HamburgerMenuVue from './HamburgerMenu.vue'
import GameContainer from '../../../game/container'

export default {
  components: {
    'hamburger-menu': HamburgerMenuVue
  },
  data () {
    return {
      MENU_STATES: MENU_STATES
    }
  },
  mounted () {
    
  },
  methods: {
    setMenuState (state, args) {
      this.$emit('onMenuStateChanged', {
        state,
        args
      })
    },
    onMenuStateChanged (e) {
      this.$emit('onMenuStateChanged', e)
    },
    panToHomeStar () {
      GameContainer.map.panToUser(this.$store.state.game)

      if (this.userPlayer) {
        this.$emit('onOpenPlayerDetailRequested', this.userPlayer._id)
      }
    }
  },
  computed: {
    game () {
      return this.$store.state.game
    },
    gameIsInProgress () {
      return GameHelper.isGameInProgress(this.$store.state.game)
    },
    gameIsFinished () {
      return GameHelper.isGameFinished(this.$store.state.game)
    },
    gameIsJoinable () {
      return !this.gameIsInProgress && !this.gameIsFinished
    },
    userPlayer () {
      return GameHelper.getUserPlayer(this.$store.state.game)
    }
  }
}
</script>

<style scoped>
.pointer {
  cursor:pointer;
}

.col {
  text-align: center;
}
</style>
