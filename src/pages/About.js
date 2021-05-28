import React from 'react'
import { Container } from 'react-bootstrap'
import { Timeline, TimelineItem } from 'vertical-timeline-component-for-react'
import FullstackInfo from '../components/FullstackInfo'
import JuniorInfo from '../components/JuniorInfo'
import MiddleInfo from '../components/MiddleInfo'
import SeniorInfo from '../components/SeniorInfo'

const About = () => {
  return (
    <Container>
      <div className='intro-about mb-4 pb-4'>
        <h1 className='mb-5'>About Me</h1>
        <ul className='list-unstyled list-info'>
          <li>👨‍👩‍👧 I am a Husband, Father and a Software Developer.</li>
          <li>🎩 I am a Computer Science graduate (2010-2014)</li>
          <li>
            💻 After my graduation I have started working as a Frontend
            Developer.
          </li>
        </ul>
      </div>
      <h2>Work Experience:</h2>
      <Timeline lineColor={'#ddd'}>
        <TimelineItem
          key='004'
          dateComponent={
            <div className='date-info'>
              <span>Aug 2014 - Nov 2015 (Promoted)</span>
            </div>
          }
          bodyContainerStyle={{
            padding: '20px',
            borderRadius: '5px',
            boxShadow: '0 0 2px rgba(106 ,133 ,160,0.3)',
          }}
        >
          <h2 className='h5'>rw-solutions</h2>
          <p>
            <strong>
              <em>Jr. Frontend Developer (Full Time)</em>
            </strong>
          </p>
          <h6>Duties & Responsibilities:</h6>
          <JuniorInfo />
        </TimelineItem>
        <TimelineItem
          key='003'
          dateComponent={
            <div className='date-info'>
              <span>Dec 2015 – Sep 2018 (Promoted)</span>
            </div>
          }
          bodyContainerStyle={{
            padding: '20px',
            borderRadius: '5px',
            boxShadow: '0 0 2px rgba(106 ,133 ,160,0.3)',
          }}
        >
          <h2 className='h5'>rw-solutions</h2>
          <p>
            <strong>
              <em>Md.Frontend Developer (Full Time)</em>
            </strong>
          </p>
          <h6>Duties & Responsibilities:</h6>
          <MiddleInfo />
        </TimelineItem>
        <TimelineItem
          key='002'
          dateText='Oct 2018 – Present'
          bodyContainerStyle={{
            padding: '20px',
            borderRadius: '5px',
            boxShadow: '0 0 2px rgba(106 ,133 ,160,0.3)',
          }}
        >
          <h2 className='h5'>rw-solutions</h2>
          <p>
            <strong>
              <em>Sr. Frontend Developer (Full Time)</em>
            </strong>
          </p>
          <h6>Duties & Responsibilities:</h6>
          <SeniorInfo />
        </TimelineItem>
        <TimelineItem
          key='001'
          dateText='June 2020 – Present'
          bodyContainerStyle={{
            padding: '20px',
            borderRadius: '5px',
            boxShadow: '0 0 2px rgba(106 ,133 ,160,0.3)',
          }}
        >
          <h2 className='h5'>Skyfall Technologies</h2>
          <p>
            <strong>
              <em>Fullstack Developer (Part TIme)</em>
            </strong>
          </p>
          <h6>Duties & Responsibilities:</h6>
          <FullstackInfo />
        </TimelineItem>
      </Timeline>
    </Container>
  )
}

export default About
