import * as PIXI from 'pixi.js'
import gameContainer from './container'
import Star from './star'
import Carrier from './carrier'
import Waypoints from './waypoints'
import EventEmitter from 'events'
import GameHelper from '../services/gameHelper'

class Map extends EventEmitter {

  // Represents the current game mode, these are as follows:
  // galaxy - Normal galaxy view
  // waypoints - Displays waypoints overlay for a given carrier
  mode = 'galaxy'

  constructor (app) {
    super()

    this.app = app
    this.container = new PIXI.Container()

    this.stars = []
    this.carriers = []
  }

  _setupContainers () {
    this.starContainer = new PIXI.Container()
    this.carrierContainer = new PIXI.Container()
    this.waypointContainer = new PIXI.Container()

    this.container.addChild(this.starContainer)
    this.container.addChild(this.carrierContainer)
    this.container.addChild(this.waypointContainer)
  }

  setup (game) {
    // Cleanup events
    this.stars.forEach(s => s.removeAllListeners())
    this.carriers.forEach(s => s.removeAllListeners())

    this.container.removeChildren()
    this._setupContainers()

    this.game = game

    // Reset the canvas
    this.stars = []
    this.carriers = []

    // Add stars
    for (let i = 0; i < this.game.galaxy.stars.length; i++) {
      this.setupStar(this.game.galaxy.stars[i])
    }

    // Add carriers
    for (let i = 0; i < this.game.galaxy.carriers.length; i++) {
      this.setupCarrier(this.game.galaxy.carriers[i])
    }

    if (this.waypoints) {
      this.waypoints.removeAllListeners()
    }

    this.waypoints = new Waypoints()
    this.waypoints.setup(this.game)
    this.waypoints.onWaypointCreatedHandler = this.waypoints.on('onWaypointCreated', this.onWaypointCreated.bind(this))

    this.waypointContainer.addChild(this.waypoints.container)
  }

  setupStar (starData) {
    let existing = this.stars.find(x => x.data._id === starData._id)

    if (existing) {
      existing.off('onStarClicked', this.onStarClicked.bind(this))

      this.starContainer.removeChild(existing.container)

      this.stars.splice(this.stars.indexOf(existing), 1)
    }

    let star = new Star(this.app)

    star.setup(this.game, starData, this.game.galaxy.players, this.game.galaxy.carriers)

    this.stars.push(star)

    this.starContainer.addChild(star.container)

    star.on('onStarClicked', this.onStarClicked.bind(this))

    return star
  }

  setupCarrier (carrierData) {
    let existing = this.carriers.find(x => x.data._id === carrierData._id)

    if (existing) {
      existing.off('onCarrierClicked', this.onCarrierClicked.bind(this))
      existing.off('onCarrierMouseOver', this.onCarrierMouseOver.bind(this))
      existing.off('onCarrierMouseOut', this.onCarrierMouseOut.bind(this))

      this.carrierContainer.removeChild(existing.container)

      this.carriers.splice(this.carriers.indexOf(existing), 1)
    }

    let carrier = new Carrier()
    let player = GameHelper.getPlayerById(this.game, carrierData.ownedByPlayerId)

    carrier.setup(carrierData, this.stars, player.colour.value)

    this.carriers.push(carrier)

    this.carrierContainer.addChild(carrier.container)

    carrier.on('onCarrierClicked', this.onCarrierClicked.bind(this))
    carrier.on('onCarrierMouseOver', this.onCarrierMouseOver.bind(this))
    carrier.on('onCarrierMouseOut', this.onCarrierMouseOut.bind(this))

    return carrier
  }

  draw () {
    this.drawStars()
    this.drawCarriers()

    if (this.mode === 'waypoints') {
      this.drawWaypoints()
    } else {
      this.clearWaypoints()
    }
  }

  setMode (mode, args) {
    this.mode = mode
    this.modeArgs = args

    this.draw()
  }

  resetMode () {
    this.mode = 'galaxy'

    this.draw()
  }

  drawStars () {
    for (let i = 0; i < this.stars.length; i++) {
      let star = this.stars[i]

      this.drawStar(star)
    }
  }

  drawStar (star) {
    star.draw()
  }

  drawCarriers () {
    for (let i = 0; i < this.carriers.length; i++) {
      let carrier = this.carriers[i]

      this.drawCarrier(carrier)
    }
  }

  drawCarrier (carrier) {
    carrier.draw()
  }

  drawWaypoints () {
    this.waypoints.draw(this.modeArgs)
  }

  clearWaypoints () {
    this.waypoints.clear()
  }

  zoomToPlayer (game, player) {
    // Find the home star the player owns.
    let homeStar = game.galaxy.stars.find(x => {
      return x._id === player.homeStarId
    })

    if (!homeStar) {
      return
    }

    gameContainer.viewport.fitWorld()
    gameContainer.viewport.zoom(-gameContainer.viewport.worldWidth, true)
    gameContainer.viewport.moveCenter(homeStar.location.x, homeStar.location.y)
  }

  zoomToUser (game) {
    let player = GameHelper.getUserPlayer(game)

    if (!player) {
      return
    }

    this.zoomToPlayer(game, player)
  }

  zoomToLocation (location) {
    gameContainer.viewport.fitWorld()
    gameContainer.viewport.zoom(-gameContainer.viewport.worldWidth, true)
    gameContainer.viewport.moveCenter(location.x, location.y)
  }

  clickStar (starId) {
    let star = this.stars.find(s => s.data._id === starId)

    star.onClicked()
  }

  clickCarrier (carrierId) {
    let carrier = this.carriers.find(s => s.data._id === carrierId)

    carrier.onClicked()
  }

  unselectAllStars () {
    this.stars
    .forEach(s => {
      s.isSelected = false
      s.drawActive()
    })
  }

  unselectAllStarsExcept (star) {
    this.stars
      .filter(s => s.isSelected || s.data._id === star.data._id) // Get only stars that are selected or the e star.
      .forEach(s => {
        // Set all other stars to unselected.
        if (s.data._id !== star.data._id) {
          s.isSelected = false
        }

        s.drawActive()
      })
  }

  onStarClicked (e) {
    // Clicking stars should only raise events to the UI if in galaxy mode.
    if (this.mode === 'galaxy') {
      let selectedStar = this.stars.find(x => x.data._id === e._id)
      selectedStar.isSelected = true
      
      this.unselectAllStarsExcept(selectedStar)
  
      if (!this.tryMultiSelect(e.location)) {
        this.emit('onStarClicked', e)
      }
    } else if (this.mode === 'waypoints') {
      this.waypoints.onStarClicked(e)
    }
  }

  onCarrierClicked (e) {
    // Clicking carriers should only raise events to the UI if in galaxy mode.
    if (this.mode === 'galaxy') {
      this.unselectAllStars()

      if (!this.tryMultiSelect(e.location)) {
        this.emit('onCarrierClicked', e)
      }
    } else if (this.mode === 'waypoints') {
      this.waypoints.onCarrierClicked(e)
    }
  }

  onCarrierMouseOver (e) {
    // If the carrier is orbiting something then send the mouse over event
    // to the star.
    if (e.orbiting) {
      let star = this.stars.find(s => s.data._id === e.orbiting)
      star.onMouseOver()
    }
  }

  onCarrierMouseOut (e) {
    // If the carrier is orbiting something then send the mouse over event
    // to the star.
    if (e.orbiting) {
      let star = this.stars.find(s => s.data._id === e.orbiting)
      star.onMouseOut()
    }
  }

  onWaypointCreated (e) {
    this.emit('onWaypointCreated', e)
  }

  tryMultiSelect (location) {
    // See if there are any other objects close by, if so then
    // we want to allow the user to select which one they want as there might be 
    // objects on the map that are on top of eachother or very close together.
    const distance = 10
    
    let closeStars = this.stars
      .map(s => {
        return {
          type: 'star',
          distance: GameHelper.getDistanceBetweenLocations(location, s.data.location),
          data: s.data
        }
      })
      .filter(s => s.distance <= distance);

    let closeCarriers = this.carriers
      .map(s => {
        return {
          type: 'carrier',
          distance: GameHelper.getDistanceBetweenLocations(location, s.data.location),
          data: s.data
        }
      })
      .filter(s => s.distance <= distance);

    // Combine the arrays and order by closest first.
    let closeObjects = closeStars.concat(closeCarriers)
      .sort((a, b) => a.distance - b.distance)

    if (closeObjects.length > 1) {
      this.emit('onObjectsClicked', closeObjects)

      return true
    }

    return false
  }

}

export default Map
