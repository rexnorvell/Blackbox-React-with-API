export function EdgeCell(props) {
    const IMAGE_TYPES = ["default", "exit", "reflection", "hit"]
    let type = (props.type < IMAGE_TYPES.length) ? (props.type) : (0)
    let image_src = "";
    if (type == 1 && props.iconNumber > 0) {
        image_src = `assets/icons/edge_${IMAGE_TYPES[type]}_${props.iconNumber}.png`
    }
    else {
        image_src = `assets/icons/edge_${IMAGE_TYPES[type]}.png`
    }
    return (
        <div className="EdgeCell" onClick={props.onClick}>
            <img src={image_src}></img>
        </div>
    )
}