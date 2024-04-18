async function bootstrap() {
    if (figma.editorType === 'figma') {
        figma.showUI(__html__, {
            width: 800,
            height: 650,
            title: 'Pager',
        });
    }
}

bootstrap();
