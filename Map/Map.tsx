import "./Map.scss"

import { ReactNode, SyntheticEvent, useEffect, useRef, useState } from "react"

import MapCSSInline from "./Map.scss?inline"

const mapStyleElement = document.createElement("style")
mapStyleElement.textContent = MapCSSInline


interface MapCountry<V> {
  color?: string
  data?: V
}

export interface MapTooltipProps<V = unknown> extends MapCountry<V> {
  countryCode: string
}

export interface MapProps<V = unknown> {
  dataset?: Record<string, MapCountry<V>>

  Legend?: (props: { dataset?: Record<string, MapCountry<V>> }) => ReactNode
  Tooltip?: (props: MapTooltipProps<V>) => ReactNode
}

function Map<V>(props: MapProps<V>) {
  const abortControllerRef = useRef<AbortController>(null)
  useEffect(() => {
    abortControllerRef.current = new AbortController
    return () => abortControllerRef.current?.abort()
  }, [])

  const objectRef = useRef<HTMLObjectElement>(null)
  useEffect(() => {
    if (objectRef.current == null) return
    setupWorldFromObject(objectRef.current)
  }, [])

  function onLoad(event: SyntheticEvent<HTMLObjectElement>) {
    setupWorldFromObject(event.currentTarget)
  }

  function setupWorld(worldSVG: SVGElement) {
    for (const countrySVG of worldSVG.children as Iterable<SVGPathElement>) {
      const { id } = countrySVG.dataset

      countrySVG.addEventListener("pointerover", onCountryHover, { signal: abortControllerRef.current?.signal })
      countrySVG.style.fill = props.dataset?.[id!]?.color ?? ""
    }

    worldSVG.prepend(mapStyleElement)
    worldSVG.setAttribute("class", "map")

    worldSVG.addEventListener("pointermove", setEvent, { signal: abortControllerRef.current?.signal })
    worldSVG.addEventListener("pointerover", () => setCountryId(""), { signal: abortControllerRef.current?.signal })
  }
  function setupWorldFromObject(objectElement: HTMLObjectElement) {
    const objectDocument = objectElement.contentDocument
    if (objectDocument == null) return

    const worldSVG = objectDocument.getElementsByTagName("svg")[0]
    if (worldSVG == null) return

    setupWorld(worldSVG)
  }

  function onCountryHover(event: PointerEvent) {
    event.stopPropagation()

    const { id } = (event.currentTarget as SVGPathElement).dataset
    if (id == null) return

    setCountryId(id)
    setCountryData(props.dataset?.[id] ?? {})
  }


  const [event, setEvent] = useState<PointerEvent | null>(null)
  const [countryId, setCountryId] = useState("")
  const [countryData, setCountryData] = useState({})

  return (
    <div style={{ position: "relative", display: "flex", gap: "2.5em", justifyContent: "center", alignItems: "center", padding: "20px 0px" }}>

      <object className="map" data="/static/map.svg" type="image/svg+xml" onLoad={onLoad} ref={objectRef} />
      <div style={{ position: "absolute", right: 0, bottom: 200 }}>{props.Legend && <props.Legend {...props.dataset} />}</div>
      {props.Tooltip && countryId.length > 0 && (
        <div className="map__tooltip" style={{ position: "absolute", top: event?.clientY, left: event?.clientX }}>
          {props.Tooltip && <props.Tooltip countryCode={countryId} {...countryData} />}
        </div>
      )}
    </div>
  )
}

export default Map
