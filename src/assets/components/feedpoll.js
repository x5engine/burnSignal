import React, { Fragment, useContext, useState, useEffect } from 'react';
import { Link, useParams, useHistory } from 'react-router-dom'
import makeBlockie from 'ethereum-blockies-base64'
import { Row, Col } from 'reactstrap'

import { getVoteInfo, getQuadratics, getRecords, ETH, chartId, toChecksumAddress } from '../../constants/operatives'
import { getPollMetadata } from '../../constants/calls/GraphQL'
import ethereum from '../../assets/images/ethereum.png'
import { store } from '../../state'

import Spline from './charts/spline'
import Bar from './charts/bar'
import Option from './option'

function Poll(props){
  const [ pollOptions, setOptions ] = useState({ yes: '', no : '' })
  const [ pollCount, setCount ] = useState({ yes: 0, no: 0 })
  const [ pollDescription , setDescription ] = useState('')
  const [ graphState, setGraphState ] = useState(false)
  const [ uniqueAddresses, setUnique ] = useState(0)
  const [ totalPledged, setPledged ] = useState(0)
  const [ pollAuthor, setAuthor ] = useState('0x')
  const [ pollRecords, setRecords ] = useState({})
  const [ modalOption, setOption ] = useState('')
  const [ modalState, setModal ] = useState('')
  const [ pollTopic, setTopic ] = useState('')
  const [ pledgedUSD, setUSD ] = useState(0)

  let { state } = useContext(store)
  let { address } = useParams()
  let history = useHistory()

  const id = props.location !== undefined ? address : props.id

  const toggle = () => setModal(!modalState)

  function triggerModal(option, bool) {
    var route = `/#/poll/${id}/${option}`

    window.history.pushState({}, window.title, route)

    setOption(option)
    toggle()
  }

  function dismiss() {
    history.goBack()
    toggle()
  }

  useEffect(() => {
    const getMetadata = async() => {
      if(state.polls[id] !== undefined){
        let { title, body, issuer, optionAaddr, optionBaddr } = state.polls[id]
        var pollMetadata = await getPollMetadata(title)

        let { yes, users, no } = pollMetadata
        let ethValue = parseInt(yes) + parseInt(no)
        let usdValue = state.price * ethValue/Math.pow(10,18)
        let records = await getRecords(state.authenicated, users)
        let quadratics = await getQuadratics(records)
        let total = ETH(ethValue)

        setCount({ yes: quadratics[0], no: quadratics[1] })
        setOptions({ yes: optionAaddr, no: optionBaddr })
        setAuthor(toChecksumAddress(issuer))
        setUnique(records.voters.length)
        setUSD(usdValue.toFixed(2))
        setRecords({ ...records })
        setDescription(body)
        setGraphState(true)
        setPledged(total)
        setTopic(title)
        }
     }
    getMetadata()
  }, [ state.polls ])

  return(
     <div className='feed-poll'>
      <Row>
      <Option modalOption={modalOption} modalToggle={dismiss} modalState={modalState} title={pollTopic} address={pollOptions} />
        <Col sm='12' md={{ size: 6, offset: 3 }}>
          <div className='card'>
            <Link to={`/poll/${id}`}>
              <div className='card-header'>
                <Link className='poll-issuer' to={`/profile/${pollAuthor}`}>
                  <img className='poll-profile' src={makeBlockie(pollAuthor)} />
                </Link>
                <div className='poll-info'>
                  <span className='poll-title'>{pollTopic}</span>
                </div>
              </div>
              <div className='card-body vote-body'>
                <button className='btn btn-simple' onClick={(e) => { e.preventDefault(); triggerModal('yes', true) }}>Yes</button>
                <button className='btn btn-simple' onClick={(e) => { e.preventDefault(); triggerModal('no', true) }}>No</button>
                <div className='poll-result'>
                  <ul>
                    <li><i id='pink' className='far fa-user'/>&nbsp;&nbsp;{uniqueAddresses}</li>
                    <li><img src={ethereum} className='eth-icon'/>&nbsp;&nbsp;{totalPledged}</li>
                    <li>Results</li>
                    {graphState && (<Bar type={true} chartId={chartId(id)} pollCount={pollCount}/>)}
                  </ul>
                </div>
              </div>
            </Link>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default Poll
