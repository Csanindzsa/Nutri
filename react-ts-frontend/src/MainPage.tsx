import React from 'react'

interface MainPageProps {
    accessToken: string | null
}

const MainPage: React.FC<MainPageProps> = ({accessToken, }) => {
  return (
    <div>MainPage</div>
  )
}

export default MainPage