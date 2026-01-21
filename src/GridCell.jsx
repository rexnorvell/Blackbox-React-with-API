export function GridCell(props) {
    const IMAGE_TYPES = ["default", "selected", "correct", "incorrect", "missed"]
    let type = (props.type < IMAGE_TYPES.length) ? (props.type) : (0)
    let image_src = `assets/icons/cell_${IMAGE_TYPES[type]}.png`
    return (
        <div className="GridCell" onClick={props.onClick}>
            <img src={image_src}></img>
        </div>
    )
}